package controllers

import (
	"strconv"

	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HolidayController struct {
	db *gorm.DB
}

func NewHolidayController(db *gorm.DB) *HolidayController {
	return &HolidayController{db: db}
}

// HolidayDay 节假日单日数据
type HolidayDay struct {
	Name     string `json:"name"`
	Date     string `json:"date"`
	IsOffDay bool   `json:"isOffDay"`
}

// HolidayResponse 节假日响应数据
type HolidayResponse struct {
	Year int          `json:"year"`
	Days []HolidayDay `json:"days"`
}

// GetHolidaysByYear 获取指定年份的节假日数据
func (ctrl *HolidayController) GetHolidaysByYear(c *gin.Context) {
	// 获取年份参数
	yearStr := c.Param("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		utils.BadRequest(c, "无效的年份参数")
		return
	}

	// 验证年份范围
	if year < 2007 || year > 2100 {
		utils.BadRequest(c, "年份必须在 2007-2100 之间")
		return
	}

	// 从数据库查询节假日数据
	var holidays []models.Holiday
	if err := ctrl.db.Where("year = ?", year).Order("date ASC").Find(&holidays).Error; err != nil {
		utils.InternalError(c, "查询节假日数据失败")
		return
	}

	// 转换数据格式
	days := make([]HolidayDay, 0, len(holidays))
	for _, holiday := range holidays {
		days = append(days, HolidayDay{
			Name:     holiday.Name,
			Date:     holiday.Date,
			IsOffDay: holiday.IsOffDay,
		})
	}

	// 返回结果
	response := HolidayResponse{
		Year: year,
		Days: days,
	}

	utils.Success(c, response)
}

