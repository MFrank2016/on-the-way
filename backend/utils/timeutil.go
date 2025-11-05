package utils

import (
	"time"

	"github.com/jinzhu/now"
)

// 初始化 now 包配置
func init() {
	// 设置周的开始为周一
	now.WeekStartDay = time.Monday
}

// Now 获取当前时间
func Now() time.Time {
	return time.Now()
}

// BeginningOfDay 获取某天的开始时间（凌晨0点）
func BeginningOfDay(t time.Time) time.Time {
	return now.New(t).BeginningOfDay()
}

// EndOfDay 获取某天的结束时间（23:59:59.999999999）
func EndOfDay(t time.Time) time.Time {
	return now.New(t).EndOfDay()
}

// BeginningOfWeek 获取本周开始时间（周一0点）
func BeginningOfWeek(t time.Time) time.Time {
	return now.New(t).BeginningOfWeek()
}

// EndOfWeek 获取本周结束时间（周日23:59:59）
func EndOfWeek(t time.Time) time.Time {
	return now.New(t).EndOfWeek()
}

// BeginningOfMonth 获取本月开始时间（1号0点）
func BeginningOfMonth(t time.Time) time.Time {
	return now.New(t).BeginningOfMonth()
}

// EndOfMonth 获取本月结束时间（最后一天23:59:59）
func EndOfMonth(t time.Time) time.Time {
	return now.New(t).EndOfMonth()
}

// Tomorrow 获取明天的开始时间
func Tomorrow(t time.Time) time.Time {
	return BeginningOfDay(t.AddDate(0, 0, 1))
}

// Yesterday 获取昨天的开始时间
func Yesterday(t time.Time) time.Time {
	return BeginningOfDay(t.AddDate(0, 0, -1))
}

// DaysAgo 获取N天前的开始时间
func DaysAgo(days int) time.Time {
	return BeginningOfDay(Now().AddDate(0, 0, -days))
}

// DaysLater 获取N天后的开始时间
func DaysLater(days int) time.Time {
	return BeginningOfDay(Now().AddDate(0, 0, days))
}

// WeeksAgo 获取N周前的开始时间（周一0点）
func WeeksAgo(weeks int) time.Time {
	t := Now().AddDate(0, 0, -weeks*7)
	return BeginningOfWeek(t)
}

// MonthsAgo 获取N个月前的开始时间（1号0点）
func MonthsAgo(months int) time.Time {
	t := Now().AddDate(0, -months, 0)
	return BeginningOfMonth(t)
}

// Today 获取今天的开始时间
func Today() time.Time {
	return BeginningOfDay(Now())
}

// TodayEnd 获取今天的结束时间
func TodayEnd() time.Time {
	return EndOfDay(Now())
}

