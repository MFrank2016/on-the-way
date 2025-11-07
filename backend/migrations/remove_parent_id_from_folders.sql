-- 移除 folders 表的 parent_id 字段及相关索引
-- 注意：执行前请确保已备份数据

-- 删除外键约束（如果存在）
-- ALTER TABLE folders DROP FOREIGN KEY IF EXISTS fk_folders_parent;

-- 删除索引
DROP INDEX IF EXISTS idx_parent_folder ON folders;

-- 删除 parent_id 列
ALTER TABLE folders DROP COLUMN parent_id;

