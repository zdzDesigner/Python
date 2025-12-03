// Package ginc provides an enhanced context and client for Gin framework,
// simplifying request/response handling, logging, and internal HTTP calls.
package ginc

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/go-resty/resty/v2" // Updated to Resty v2
)

// Contexter defines the interface for handling Gin contexts with extended features.
// It provides methods for parsing requests, sending responses, logging, and making HTTP calls.
type Contexter interface {
	// ParseReqbody parses the JSON request body into the provided struct.
	// Returns an error if parsing fails, and sends a failure response.
	ParseReqbody(any) error
	// ParseMultipartForm parses multipart form data with dynamic max memory based on Content-Length.
	ParseMultipartForm(defaultMaxMemory ...int64) error
	// Success sends a successful JSON response (HTTP 200) with optional data.
	// Default code is 0 if not provided.
	Success(...gin.H)
	// SuccessByte sends a successful byte response (HTTP 200) with custom Content-Type.
	SuccessByte([]byte, ...string)
	// Fail sends a failure JSON response (HTTP 200) with the provided data.
	Fail(any)
	// FailErr sends a failure JSON response with code and error message.
	FailErr(int, string)
	// GinCtx returns the underlying Gin context.
	GinCtx() *gin.Context
	// Query retrieves a query parameter by key.
	Query(string) string
	// ClientPost makes a POST request using the internal client.
	ClientPost(string, any, ...map[string]string) (*resty.Response, error)
	// ClientPut makes a PUT request using the internal client.
	ClientPut(string, any, ...map[string]string) (*resty.Response, error)
	// ClientGet makes a GET request using the internal client.
	ClientGet(string, any, ...map[string]string) (*resty.Response, error)
	// ParamRoute retrieves a route parameter by key, trimming slashes.
	ParamRoute(string) string
	// Log records a log entry (appends and clears loggings).
	Log(string)
	// Logging records a partial log entry without newline.
	Logging(string)
}

// Context is a wrapper around gin.Context with additional features like logging and client.
type Context struct {
	Gin      *gin.Context
	Client   *Client
	keys     map[string]any
	m        sync.RWMutex // Use RWMutex for better concurrency
	logs     []string
	loggings []string
	tally    map[string]string // Unused; consider removing if not needed
}

// Handler wraps a function that takes Contexter into a gin.HandlerFunc.
func Handler(fn func(c Contexter)) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := &Context{Gin: c, Client: NewClient()} // Initialize Client here or inject
		fn(ctx)
	}
}

// GinCtx returns the underlying Gin context.
func (c *Context) GinCtx() *gin.Context {
	return c.Gin
}

// Query retrieves a query parameter.
func (c *Context) Query(query string) string {
	return c.Gin.Query(query)
}

// ParamRoute retrieves a route parameter by key.
func (c *Context) ParamRoute(key string) string {
	return strings.Trim(c.Gin.Param(key), "/")
}

// ParseReqbody parses the request body into the provided struct.
func (c *Context) ParseReqbody(reqbody any) error {
	// Optionally add body size limit: c.Gin.Request.Body = http.MaxBytesReader(c.Gin.Writer, c.Gin.Request.Body, maxSize)
	if err := c.Gin.ShouldBindJSON(reqbody); err != nil && err != io.EOF {
		errMsg := fmt.Sprintf("Parameter parsing error: %s", err.Error())
		c.FailErr(400, errMsg)
		return errors.New(errMsg)
	}
	return nil
}

// ParseMultipartForm parses multipart form data with dynamic max memory based on Content-Length.
// If defaultMaxMemory is not provided, uses 32MB as default.
// Automatically adjusts memory allocation based on Content-Length header.
func (c *Context) ParseMultipartForm(defaultMaxMemory ...int64) error {
	// Set default max memory
	maxMemory := int64(32 << 20) // 32MB default
	if len(defaultMaxMemory) > 0 && defaultMaxMemory[0] > 0 {
		maxMemory = defaultMaxMemory[0]
	}

	// Get Content-Length from request header
	contentLength := c.Gin.Request.ContentLength
	if contentLength > 0 {
		log.Printf("Multipart form Content-Length: %d bytes (%.2f MB)", contentLength, float64(contentLength)/(1024*1024))
		
		// Adjust max memory based on content length
		if contentLength < maxMemory {
			// Use Content-Length + 10MB buffer for smaller requests
			maxMemory = contentLength + (10 << 20)
		}
	}

	// Parse multipart form
	if err := c.Gin.Request.ParseMultipartForm(maxMemory); err != nil {
		errMsg := fmt.Sprintf("Failed to parse multipart form: %s", err.Error())
		c.FailErr(400, errMsg)
		return errors.New(errMsg)
	}

	return nil
}

// Success sends a successful response.
func (c *Context) Success(datas ...gin.H) {
	data := make(map[string]any)
	if len(datas) > 0 {
		data = datas[0]
	}
	if data["code"] == nil {
		data["code"] = 0
	}
	c.Log(fmt.Sprintf("code: %v", data["code"]))

	b, err := json.Marshal(data)
	if err != nil {
		c.Log(fmt.Sprintf("JSON Marshal error: %v", err))
		c.FailErr(500, "Internal server error")
		return
	}
	c.updateGinLogs()
	c.Gin.Data(200, "application/json", b)
}

// SuccessByte sends a byte response.
func (c *Context) SuccessByte(b []byte, params ...string) {
	c.updateGinLogs()
	contentType := "application/json"
	if len(params) > 0 {
		contentType = params[0]
	}
	c.Gin.Data(200, contentType, b)
}

// Fail sends a failure response.
func (c *Context) Fail(data any) {
	b, err := json.Marshal(data)
	if err != nil {
		c.Log(fmt.Sprintf("JSON Marshal error: %v", err))
		c.FailErr(500, "Internal server error")
		return
	}
	c.updateGinLogs()
	c.Gin.Data(200, "application/json", b)
}

// FailErr sends a failure response with code and message.
func (c *Context) FailErr(code int, errmsg string) {
	c.Fail(map[string]any{
		"code":   code,
		"errmsg": errmsg,
	})
}

// updateGinLogs updates the Gin context with logs (formerly ReWrite).
func (c *Context) updateGinLogs() {
	c.Gin.Set("LOGIC_LIST", c.logs)
}

// Logging appends a partial log without newline.
func (c *Context) Logging(log string) {
	c.m.Lock()
	defer c.m.Unlock()
	if c.loggings == nil {
		c.loggings = make([]string, 0)
	}
	c.loggings = append(c.loggings, log)
}

// Log appends a full log entry and clears loggings.
func (c *Context) Log(log string) {
	c.m.Lock()
	defer c.m.Unlock()
	if c.logs == nil {
		c.logs = make([]string, 0)
	}
	c.logs = append(c.logs, strings.Join(append(c.loggings, log), ""))
	c.loggings = []string{}
}

// getKey retrieves a value from keys (thread-safe).
func (c *Context) getKey(key string) (value any, exists bool) {
	c.m.RLock()
	defer c.m.RUnlock()
	value, exists = c.keys[key]
	return
}

// setKey sets a value in keys (thread-safe).
func (c *Context) setKey(key string, value any) {
	c.m.Lock()
	defer c.m.Unlock()
	if c.keys == nil {
		c.keys = make(map[string]any)
	}
	c.keys[key] = value
}

// getIntKey retrieves an int from keys.
func (c *Context) getIntKey(key string) int {
	if val, ok := c.getKey(key); ok && val != nil {
		if i, ok := val.(int); ok {
			return i
		}
	}
	return 0
}

// ClientPost makes a POST request.
func (c *Context) ClientPost(api string, params any, options ...map[string]string) (*resty.Response, error) {
	return c.request(c.Client.postRow)(api, params, options...)
}

// ClientPut makes a PUT request.
func (c *Context) ClientPut(api string, params any, options ...map[string]string) (*resty.Response, error) {
	return c.request(c.Client.putRow)(api, params, options...)
}

// ClientGet makes a GET request.
func (c *Context) ClientGet(api string, params any, options ...map[string]string) (*resty.Response, error) {
	return c.request(c.Client.getRow)(api, params, options...)
}

type (
	requestHandler func(string, any, ...map[string]string) (*resty.Response, map[string]any, error)
	requestFunc    func(string, any, ...map[string]string) (*resty.Response, error)
)

// request wraps common request logic with logging and filtering.
func (c *Context) request(fn requestHandler) requestFunc {
	return func(api string, params any, options ...map[string]string) (*resty.Response, error) {
		// Inject headers for specific APIs
		if strings.Contains(api, os.Getenv("KONG_CONTENT_SERVER_INTERNAL")) { // Consider using config library like Viper
			headers := c.Gin.GetStringMapString("headers")
			if headers != nil {
				if len(options) > 0 {
					options[0] = MapAssign(headers, options[0])
				} else {
					options = []map[string]string{headers}
				}
			}
		}
		// Apply source filter
		params = c.applySourceFilter(params)

		resp, log, err := fn(api, params, options...)
		if err != nil {
			log["error_details"] = err.Error() // Add more details
		}

		c.m.Lock()
		count := c.getIntKey("REQUEST_COUNT") + 1
		c.setKey("REQUEST_COUNT", count)

		source, _ := c.getKey("REQUEST_SOURCE")
		var sources []map[string]any
		if source != nil {
			sources = source.([]map[string]any)
		}
		sources = append(sources, log)
		c.setKey("REQUEST_SOURCE", sources)
		c.m.Unlock()

		return resp, err
	}
}

// applySourceFilter adds sourceFilter if present in headers.
func (c *Context) applySourceFilter(params any) any {
	sourceFilter := c.Gin.GetString("sourceFilter")
	if sourceFilter == "1" {
		switch p := params.(type) {
		case map[string]string:
			p["sourceFilter"] = sourceFilter
			return p
		case map[string]any:
			p["sourceFilter"] = sourceFilter
			return p
		}
		// Log if type not supported
		c.Log(fmt.Sprintf("Unsupported params type for sourceFilter: %T", params))
	}
	return params
}

// NewContext creates a new Context for testing or non-Gin use.
func NewContext() Contexter {
	return &Context{Gin: &gin.Context{}}
}