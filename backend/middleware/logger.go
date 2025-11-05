package middleware

import (
	"bytes"
	"io"
	"on-the-way/backend/utils"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// responseWriter 包装 gin.ResponseWriter 以捕获响应内容
type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// LoggerMiddleware 自定义日志中间件
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 跳过 OPTIONS 请求（CORS 预检）
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		// 记录开始时间
		start := time.Now()

		// 读取请求体
		var requestBody []byte
		if c.Request.Body != nil && (c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH") {
			requestBody, _ = io.ReadAll(c.Request.Body)
			// 重新设置请求体供后续处理
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// 限制请求体大小避免日志过大（最多记录10KB）
		const maxBodySize = 10 * 1024 // 10KB
		if len(requestBody) > maxBodySize {
			requestBody = append(requestBody[:maxBodySize], []byte("...(truncated)")...)
		}

		// 包装 ResponseWriter 以捕获响应
		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:           bytes.NewBufferString(""),
		}
		c.Writer = writer

		// 处理请求
		c.Next()

		// 计算耗时
		duration := time.Since(start)

		// 获取响应体内容
		responseBody := writer.body.Bytes()
		// 使用与请求体相同的大小限制
		if len(responseBody) > maxBodySize {
			responseBody = append(responseBody[:maxBodySize], []byte("...(truncated)")...)
		}

		// 构建日志字段
		fields := []zap.Field{
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.String("query", c.Request.URL.RawQuery),
			zap.Int("status", c.Writer.Status()),
			zap.String("client_ip", c.ClientIP()),
			zap.Duration("duration", duration),
			zap.String("user_agent", c.Request.UserAgent()),
		}

		// 添加请求体（如果存在）
		if len(requestBody) > 0 {
			fields = append(fields, zap.ByteString("request_body", requestBody))
		}

		// 添加响应体
		if len(responseBody) > 0 {
			fields = append(fields, zap.ByteString("response_body", responseBody))
		}

		// 记录日志
		statusCode := c.Writer.Status()
		if statusCode >= 500 {
			utils.LogError("Server error", fields...)
		} else if statusCode >= 400 {
			utils.LogWarn("Client error", fields...)
		} else {
			utils.LogInfo("Request completed", fields...)
		}
	}
}

