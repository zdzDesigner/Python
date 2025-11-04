package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func main() {
	// --- 配置 ---
	// API服务器的URL
	apiURL := "http://127.0.0.1:8800/inference"
	// 要合成的文本
	textToSynthesize := "你好，这是一个通过 Golang 客户端生成的语音。"
	// 参考音色的音频文件路径 (spk_audio_prompt)
	// speakerAudioPath := "../run.sh" // 使用项目中的示例文件
	speakerAudioPath := "/home/zdz/temp/TTS/assets/self_voice.wav" // 使用项目中的示例文件
	// 生成的音频要保存的路径
	outputWavPath := "output.wav"

	fmt.Println("正在准备发送请求到 TTS API...")

	// --- 创建 multipart/form-data 请求体 ---
	var requestBody bytes.Buffer
	// 创建一个multipart writer，它会将数据写入requestBody
	writer := multipart.NewWriter(&requestBody)

	// 1. 添加文本字段
	err := writer.WriteField("text", textToSynthesize)
	if err != nil {
		fmt.Printf("错误：无法添加 'text' 字段: %v\n", err)
		return
	}
    // 你可以在这里添加更多表单字段，例如：
    // writer.WriteField("emo_alpha", "0.8")
    // writer.WriteField("use_random", "true")
    writer.WriteField("use_emo_text", "true")

	// 2. 添加文件字段 (spk_audio_prompt)
	file, err := os.Open(speakerAudioPath)
	if err != nil {
		fmt.Printf("错误：无法打开参考音频文件 '%s': %v\n", speakerAudioPath, err)
		return
	}
	defer file.Close()

	// 创建一个用于文件的form-data部分
	part, err := writer.CreateFormFile("spk_audio_prompt", filepath.Base(speakerAudioPath))
	if err != nil {
		fmt.Printf("错误：无法创建文件的form-data部分: %v\n", err)
		return
	}

	// 将文件内容拷贝到form-data部分
	_, err = io.Copy(part, file)
	if err != nil {
		fmt.Printf("错误：无法将文件内容拷贝到请求体: %v\n", err)
		return
	}

	// --- 完成请求体并发送请求 ---
	// 关闭multipart writer来写入结尾的boundary
	err = writer.Close()
	if err != nil {
		fmt.Printf("错误：无法关闭 multipart writer: %v\n", err)
		return
	}

	// 创建HTTP POST请求
	req, err := http.NewRequest("POST", apiURL, &requestBody)
	if err != nil {
		fmt.Printf("错误：无法创建HTTP请求: %v\n", err)
		return
	}

	// 设置正确的Content-Type，包含boundary
	req.Header.Set("Content-Type", writer.FormDataContentType())

	fmt.Println("请求已发送，等待服务器响应...")

	// 发送请求
	client := &http.Client{Timeout: time.Second * 120} // 设置一个较长的超时时间
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("错误：发送HTTP请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// --- 处理响应 ---
	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		// 如果不是200 OK，读取并打印错误信息
		errorBody, _ := io.ReadAll(resp.Body)
		fmt.Printf("错误：API返回了非200状态码: %d\n", resp.StatusCode)
		fmt.Printf("错误详情: %s\n", string(errorBody))
		return
	}

	// 创建输出文件
	outputFile, err := os.Create(outputWavPath)
	if err != nil {
		fmt.Printf("错误：无法创建输出文件 '%s': %v\n", outputWavPath, err)
		return
	}
	defer outputFile.Close()

	// 将响应体（音频数据）拷贝到输出文件
	_, err = io.Copy(outputFile, resp.Body)
	if err != nil {
		fmt.Printf("错误：无法将音频数据写入文件: %v\n", err)
		return
	}

	fmt.Printf("\n✨ 成功！音频文件已保存到: %s\n", outputWavPath)
}

