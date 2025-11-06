package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// FileItem 表示一个文件或文件夹的结构
type FileItem struct {
	Name string // 使用"文件夹/文件名"方式命名
	Path string // 音频文件的完整路径
}

// ReadDirectoryRecursive 递归读取目录，返回音频文件列表
func ReadDirectoryRecursive(rootPath string) ([]FileItem, error) {
	var fileList []FileItem

	err := filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 只处理文件，跳过目录
		if info.IsDir() {
			return nil
		}

		// 检查是否为音频文件
		ext := strings.ToLower(filepath.Ext(path))
		isAudioFile := false
		
		switch ext {
		case ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma", ".opus":
			isAudioFile = true
		}

		// 如果不是音频文件，跳过
		if !isAudioFile {
			return nil
		}

		// 获取相对路径
		relPath, err := filepath.Rel(rootPath, path)
		if err != nil {
			return err
		}

		// 忽略根目录本身
		if relPath == "." {
			return nil
		}

		// 将路径分隔符统一为斜杠
		relPath = filepath.ToSlash(relPath)

		// 创建音频文件项
		fileItem := FileItem{
			Name: relPath,
			Path: path, // 保存完整路径
		}

		fileList = append(fileList, fileItem)

		return nil
	})

	if err != nil {
		return nil, err
	}

	return fileList, nil
}

// AudioFilesHandler 处理音频文件列表请求
func AudioFilesHandler(w http.ResponseWriter, r *http.Request) {
	// 读取音频文件目录
	rootPath := "/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav"
	
	fileList, err := ReadDirectoryRecursive(rootPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 设置响应头
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*") // 允许跨域请求
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	
	// 返回JSON格式的文件列表
	json.NewEncoder(w).Encode(map[string]interface{}{
		"files": fileList,
		"count": len(fileList),
	})
}

func main() {
	// 启动HTTP服务器
	http.HandleFunc("/api/audio-files", AudioFilesHandler)
	
	// 添加一个简单的健康检查端点
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
			"message": "Server is running",
		})
	})
	
	fmt.Println("Audio API server starting on http://localhost:8081")
	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		fmt.Printf("Server error: %v\n", err)
	}
}