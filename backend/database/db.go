package database

import (
	"database/sql"
	"on-the-way/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	// 使用纯Go实现的SQLite驱动（不需要CGO）
	_ "modernc.org/sqlite"
)

func InitDB(dbPath string) (*gorm.DB, error) {
	// 使用纯Go的SQLite驱动打开数据库
	sqlDB, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	// 使用GORM的通用驱动，传入已打开的sql.DB
	db, err := gorm.Open(sqlite.Dialector{Conn: sqlDB}, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	// 自动迁移模型
	err = db.AutoMigrate(
		&models.User{},
		&models.Folder{},
		&models.List{},
		&models.Task{},
		&models.Tag{},
		&models.TaskTag{},
		&models.Pomodoro{},
		&models.Habit{},
		&models.HabitRecord{},
		&models.Countdown{},
		&models.Statistics{},
		&models.Reminder{},
		&models.UserSettings{},
		&models.Filter{},
		&models.ViewConfig{},
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}
