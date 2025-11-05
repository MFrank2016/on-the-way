# 部署指南

## 🚀 快速开始

### 前置要求

- Go 1.21+
- Node.js 18+
- Git

### 本地开发

#### 1. 克隆项目

```bash
git clone <your-repo-url>
cd on-the-way
```

#### 2. 启动后端

```bash
cd backend

# 首次运行 - 自动创建数据库
go run main.go

# 或者编译后运行
go build -o server.exe .
./server.exe
```

后端运行在 `http://localhost:8080`

#### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在 `http://localhost:3000`

#### 4. 访问应用

打开浏览器访问 `http://localhost:3000`，注册账号即可使用。

## 📦 生产环境部署

### 后端部署

#### 方式1：直接运行

```bash
cd backend

# 编译
go build -o server .

# 配置环境变量
export PORT=8080
export DATABASE_PATH=/data/app.db
export JWT_SECRET=your-secret-key

# 运行
./server
```

#### 方式2：Docker部署

创建 `backend/Dockerfile`:

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .
RUN go build -o server .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
```

构建和运行:

```bash
cd backend
docker build -t on-the-way-backend .
docker run -d -p 8080:8080 \
  -v /data:/data \
  -e DATABASE_PATH=/data/app.db \
  -e JWT_SECRET=your-secret-key \
  on-the-way-backend
```

#### 方式3：使用Systemd服务

创建 `/etc/systemd/system/on-the-way.service`:

```ini
[Unit]
Description=On The Way Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/on-the-way/backend
ExecStart=/opt/on-the-way/backend/server
Restart=always
Environment=PORT=8080
Environment=DATABASE_PATH=/data/app.db
Environment=JWT_SECRET=your-secret-key

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl start on-the-way
sudo systemctl enable on-the-way
```

### 前端部署

#### 方式1：Vercel（推荐）

1. 将代码推送到GitHub
2. 在Vercel导入项目
3. 设置环境变量：
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```
4. 点击部署

#### 方式2：自建服务器

```bash
cd frontend

# 构建
npm run build

# 使用PM2运行
npm install -g pm2
pm2 start npm --name "on-the-way-frontend" -- start

# 或使用Nginx代理
```

Nginx配置示例:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 方式3：Docker部署

创建 `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

构建和运行:

```bash
cd frontend
docker build -t on-the-way-frontend .
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-api-domain.com/api \
  on-the-way-frontend
```

## 🐳 Docker Compose部署（推荐）

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DATABASE_PATH=/data/app.db
      - JWT_SECRET=your-secret-key-change-this
    volumes:
      - ./data:/data
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  data:
```

启动:

```bash
docker-compose up -d
```

## 🔒 安全配置

### 1. 更改JWT密钥

```bash
# 生成随机密钥
openssl rand -base64 32

# 设置环境变量
export JWT_SECRET=生成的随机密钥
```

### 2. HTTPS配置

使用Let's Encrypt获取免费SSL证书:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 数据库备份

```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /data/app.db /backups/app_$DATE.db
find /backups -name "app_*.db" -mtime +7 -delete
```

## 📊 监控

### 日志查看

```bash
# 后端日志
journalctl -u on-the-way -f

# Docker日志
docker-compose logs -f
```

### 性能监控

可以使用以下工具:
- Prometheus + Grafana
- New Relic
- Datadog

## 🔧 常见问题

### Q: 数据库文件在哪里？
A: 默认在 `backend/data.db`，可通过 `DATABASE_PATH` 环境变量修改

### Q: 如何迁移数据？
A: 直接复制 SQLite 数据库文件即可

### Q: CORS错误怎么办？
A: 检查后端CORS配置，确保前端域名在允许列表中

### Q: 如何重置管理员密码？
A: 直接在数据库中修改users表的password_hash字段

## 📝 环境变量

### 后端环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 8080 |
| DATABASE_PATH | 数据库文件路径 | ./data.db |
| JWT_SECRET | JWT密钥 | 需要修改 |

### 前端环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NEXT_PUBLIC_API_URL | API地址 | http://localhost:8080/api |

## 🎯 性能优化建议

1. **数据库优化**
   - 定期VACUUM清理
   - 添加适当索引
   - 考虑迁移到PostgreSQL（大规模使用）

2. **前端优化**
   - 启用CDN
   - 图片优化
   - 代码分割已实现

3. **后端优化**
   - 添加Redis缓存
   - 启用Gzip压缩
   - 负载均衡

## 📧 技术支持

如有问题，请提交Issue或联系开发团队。

---

更新时间：2025-11-04

