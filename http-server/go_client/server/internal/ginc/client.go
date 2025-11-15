// Continuation of package ginc: Client implementation.
package ginc

// Continuation of package ginc: Client implementation.

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-resty/resty/v2" // Updated to Resty v2
)

// MethodType defines HTTP method types.
type MethodType int

const (
	_ MethodType = iota
	POST
	GET
	PUT
)

// Client handles HTTP requests with Resty v2.
type Client struct {
	resty *resty.Client // Shared client for efficiency
}

// NewClient creates a new Client with shared Resty v2 instance.
func NewClient() *Client {
	client := resty.New()
	client.SetTimeout(5 * time.Second) // Default timeout; configurable
	return &Client{resty: client}
}

// postRow performs a POST request and returns response, log, error.
func (c *Client) postRow(api string, params any, options ...map[string]string) (*resty.Response, map[string]any, error) {
	headers, timeout := c.parseOptions(options...)
	return c.request(POST, api, params, headers, timeout)
}

// putRow performs a PUT request.
func (c *Client) putRow(api string, params any, options ...map[string]string) (*resty.Response, map[string]any, error) {
	headers, timeout := c.parseOptions(options...)
	return c.request(PUT, api, params, headers, timeout)
}

// getRow performs a GET request.
func (c *Client) getRow(api string, params any, options ...map[string]string) (*resty.Response, map[string]any, error) {
	headers, timeout := c.parseOptions(options...)
	return c.request(GET, api, params, headers, timeout)
}

// Post performs a POST request (simplified).
func (c *Client) Post(api string, params any, options ...map[string]string) (*resty.Response, error) {
	resp, _, err := c.postRow(api, params, options...)
	return resp, err
}

// Get performs a GET request (simplified).
func (c *Client) Get(api string, params any, options ...map[string]string) (*resty.Response, error) {
	resp, _, err := c.getRow(api, params, options...)
	return resp, err
}

// parseOptions extracts headers and timeout from options.
func (c *Client) parseOptions(options ...map[string]string) (map[string]string, time.Duration) {
	if len(options) == 0 {
		return nil, 0
	}
	headers := options[0]
	timeoutKey := "TIME_OUT"
	var timeout time.Duration
	if timeoutStr, ok := headers[timeoutKey]; ok {
		if t, err := strconv.ParseFloat(timeoutStr, 64); err == nil {
			timeout = time.Duration(t * float64(time.Millisecond))
		}
		delete(headers, timeoutKey)
	}
	return headers, timeout
}

// request executes the HTTP request using Resty v2.
func (c *Client) request(typer MethodType, api string, params any, headers map[string]string, timeout time.Duration) (*resty.Response, map[string]any, error) {
	req := c.resty.R().
		SetHeader("Content-Type", "application/json")

	// Set per-request timeout using context if specified
	ctx := context.Background()
	if timeout != 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, timeout)
		defer cancel()
		req.SetContext(ctx)
	}

	// Environment-specific headers (consider config)
	apiEnv := os.Getenv("API_ENV")
	if apiEnv != "" {
		// Assuming lang.Contains exists; if not, implement inline
		contains := func(ss []string, s string) bool {
			for _, v := range ss {
				if v == s {
					return true
				}
			}
			return false
		}
		if contains([]string{"LOCAL_BETA"}, apiEnv) {
			req.SetHeader("Host", "kong.adam.svc.cluster.local")
		}
	}

	if headers != nil {
		req.SetHeaders(headers)
	}

	timer := time.Now()
	var resp *resty.Response
	var err error

	switch typer {
	case POST:
		resp, err = req.SetBody(params).Post(api)
	case PUT:
		resp, err = req.SetBody(params).Put(api)
	case GET:
		if params == nil {
			resp, err = req.Get(api)
		} else if v, ok := params.(map[string]string); ok {
			resp, err = req.SetQueryParams(v).Get(api)
		} else {
			err = errors.New("GET params must be map[string]string or nil")
		}
	default:
		err = fmt.Errorf("unsupported method: %s", c.methodToString(typer))
	}

	consume := time.Since(timer).Milliseconds()
	isTimeout := err != nil && strings.Contains(err.Error(), "context deadline exceeded")
	log := map[string]any{
		"url":     api,
		"params":  params,
		"consume": consume,
		"error":   resp != nil && resp.IsError(),
		"timeout": isTimeout,
	}

	if err != nil {
		if isTimeout {
			return nil, log, errors.New("request timeout")
		}
		return nil, log, err
	}
	if resp.IsError() {
		log["response_body"] = string(resp.Body()) // For debugging
		return nil, log, fmt.Errorf("request failed: %s (Status: %d)", resp.Status(), resp.StatusCode())
	}

	return resp, log, nil
}

// methodToString converts MethodType to string.
func (c *Client) methodToString(typer MethodType) string {
	methods := map[MethodType]string{
		POST: "POST",
		GET:  "GET",
		PUT:  "PUT",
	}
	return methods[typer]
}
