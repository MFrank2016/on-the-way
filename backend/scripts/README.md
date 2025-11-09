# 节假日数据导入脚本

## 功能说明

本脚本用于从 GitHub 仓库获取中国法定节假日数据并导入到数据库中。

## 数据来源

- GitHub 仓库: https://github.com/NateScarlet/holiday-cn
- 数据年份范围: 2007-2026

## 使用方法

### 1. 确保在backend目录

脚本需要在 backend 目录下运行，因为它使用相对路径 `./data.db`

```bash
cd backend
```

### 2. 运行导入脚本

```bash
go run scripts/import_holidays.go
```

或者从 scripts 目录运行（需要调整数据库路径）：

```bash
cd scripts
DATABASE_PATH=../data.db go run import_holidays.go
```

脚本将自动：
- 连接数据库
- 从 GitHub 获取 2007-2026 年的节假日数据
- 解析 JSON 数据
- 批量插入到 holidays 表中
- 如果数据已存在，会先删除旧数据再插入新数据

### 3. 查看导入结果

脚本会输出每年的导入进度和结果：
```
开始导入节假日数据...
正在导入 2007 年的数据...
  成功插入 23 条记录
成功导入 2007 年的数据
...
导入完成！成功: 20, 失败: 0
```

## 数据结构

导入的数据包含以下字段：
- `year`: 年份
- `name`: 节假日名称（如"春节"、"国庆节"）
- `date`: 日期（格式：YYYY-MM-DD）
- `is_off_day`: 是否为休息日

## 注意事项

1. 首次运行会自动创建 holidays 表
2. 重复运行会覆盖已存在的数据
3. 网络请求失败会跳过该年份，继续处理下一年
4. 导入过程中会有短暂延迟，避免请求过快

## API 使用

导入数据后，可以通过以下 API 获取节假日信息：

```
GET /api/holidays/:year
```

示例：
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/holidays/2026
```

响应格式：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "year": 2026,
    "days": [
      {
        "name": "元旦",
        "date": "2026-01-01",
        "isOffDay": true
      }
    ]
  }
}
```

