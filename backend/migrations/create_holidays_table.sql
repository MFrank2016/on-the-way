-- 创建节假日表
CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    date VARCHAR(10) NOT NULL,
    is_off_day BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_year ON holidays(year);
CREATE INDEX IF NOT EXISTS idx_date ON holidays(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_year_date ON holidays(year, date);

-- 添加触发器自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_holidays_timestamp 
AFTER UPDATE ON holidays
FOR EACH ROW
BEGIN
    UPDATE holidays SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

