package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"on-the-way/backend/config"
	"on-the-way/backend/database"
	"on-the-way/backend/models"

	"gorm.io/gorm"
)

const (
	githubURLTemplate = "https://raw.githubusercontent.com/NateScarlet/holiday-cn/refs/heads/master/%d.json"
	startYear         = 2007
	endYear           = 2026
)

// GitHubHolidayData GitHub返回的节假日数据结构
type GitHubHolidayData struct {
	Year   int                   `json:"year"`
	Days   []GitHubHolidayDay    `json:"days"`
}

// GitHubHolidayDay GitHub节假日单日数据
type GitHubHolidayDay struct {
	Name     string `json:"name"`
	Date     string `json:"date"`
	IsOffDay bool   `json:"isOffDay"`
}

func main() {
	// 加载配置
	cfg := config.Load()
	
	// 初始化数据库连接
	db, err := database.InitDB(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	
	// 自动迁移Holiday表
	if err := db.AutoMigrate(&models.Holiday{}); err != nil {
		log.Fatalf("Failed to migrate Holiday table: %v", err)
	}
	
	log.Println("开始导入节假日数据...")
	
	successCount := 0
	failCount := 0
	
	for year := startYear; year <= endYear; year++ {
		log.Printf("正在导入 %d 年的数据...", year)
		
		if err := importHolidaysForYear(db, year); err != nil {
			log.Printf("导入 %d 年数据失败: %v", year, err)
			failCount++
			continue
		}
		
		log.Printf("成功导入 %d 年的数据", year)
		successCount++
		
		// 避免请求过快，休息一下
		time.Sleep(500 * time.Millisecond)
	}
	
	log.Printf("\n导入完成！成功: %d, 失败: %d", successCount, failCount)
}

// importHolidaysForYear 导入指定年份的节假日数据
func importHolidaysForYear(db *gorm.DB, year int) error {
	// 1. 从GitHub获取数据
	url := fmt.Sprintf(githubURLTemplate, year)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("HTTP请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP状态码错误: %d", resp.StatusCode)
	}
	
	// 2. 读取响应体
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取响应失败: %w", err)
	}
	
	// 3. 解析JSON
	var data GitHubHolidayData
	if err := json.Unmarshal(body, &data); err != nil {
		return fmt.Errorf("解析JSON失败: %w", err)
	}
	
	// 4. 检查是否已存在该年份数据
	var count int64
	db.Model(&models.Holiday{}).Where("year = ?", year).Count(&count)
	
	// 如果已存在，先删除旧数据
	if count > 0 {
		log.Printf("  删除 %d 年的旧数据 (%d 条)", year, count)
		if err := db.Where("year = ?", year).Delete(&models.Holiday{}).Error; err != nil {
			return fmt.Errorf("删除旧数据失败: %w", err)
		}
	}
	
	// 5. 批量插入新数据
	if len(data.Days) == 0 {
		log.Printf("  %d 年没有节假日数据", year)
		return nil
	}
	
	holidays := make([]models.Holiday, 0, len(data.Days))
	for _, day := range data.Days {
		holidays = append(holidays, models.Holiday{
			Year:     year,
			Name:     day.Name,
			Date:     day.Date,
			IsOffDay: day.IsOffDay,
		})
	}
	
	// 使用事务批量插入
	if err := db.Create(&holidays).Error; err != nil {
		return fmt.Errorf("批量插入失败: %w", err)
	}
	
	log.Printf("  成功插入 %d 条记录", len(holidays))
	return nil
}

