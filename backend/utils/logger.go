package utils

import (
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Logger *zap.Logger

// InitLogger 初始化日志系统
func InitLogger() error {
	// 确保日志目录存在
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return err
	}

	// 配置 lumberjack 实现日志滚动
	lumberjackLogger := &lumberjack.Logger{
		Filename:   filepath.Join(logDir, "app.log"), // 日志文件路径
		MaxSize:    100,                              // 单个文件最大100MB
		MaxBackups: 7,                                // 最多保留7个备份
		MaxAge:     7,                                // 最多保留7天
		Compress:   true,                             // 压缩旧日志
		LocalTime:  true,                             // 使用本地时间
	}

	// 配置编码器
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	// 创建 core
	fileCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(lumberjackLogger),
		zapcore.InfoLevel,
	)

	// 同时输出到控制台（开发环境）
	consoleEncoderConfig := encoderConfig
	consoleEncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(consoleEncoderConfig),
		zapcore.AddSync(os.Stdout),
		zapcore.DebugLevel,
	)

	// 合并多个 core
	core := zapcore.NewTee(fileCore, consoleCore)

	// 创建 logger
	Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))

	return nil
}

// Sync 同步日志缓冲区
func Sync() {
	if Logger != nil {
		_ = Logger.Sync()
	}
}

// LogInfo 记录 Info 级别日志
func LogInfo(msg string, fields ...zap.Field) {
	Logger.Info(msg, fields...)
}

// LogDebug 记录 Debug 级别日志
func LogDebug(msg string, fields ...zap.Field) {
	Logger.Debug(msg, fields...)
}

// LogWarn 记录 Warn 级别日志
func LogWarn(msg string, fields ...zap.Field) {
	Logger.Warn(msg, fields...)
}

// LogError 记录 Error 级别日志
func LogError(msg string, fields ...zap.Field) {
	Logger.Error(msg, fields...)
}

// LogFatal 记录 Fatal 级别日志并退出程序
func LogFatal(msg string, fields ...zap.Field) {
	Logger.Fatal(msg, fields...)
}
