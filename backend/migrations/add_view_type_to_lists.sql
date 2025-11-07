-- 为 lists 表添加 view_type 字段
ALTER TABLE lists ADD COLUMN view_type VARCHAR(20) DEFAULT 'list';

-- 为现有记录设置默认值
UPDATE lists SET view_type = 'list' WHERE view_type IS NULL OR view_type = '';

