# 学分进度追踪器 (Credit Progress Tracker)

这是一个全栈 Web 应用，用于学员提交学分申请、管理员在线审核、批量进度调整、以及自动化报表生成。

## 🔐 安全与隐私 (重要)
为防止敏感信息泄露，本项目采用了 **环境变量隔离** 机制：
- **管理员名单**、**服务器端口** 等配置均存储在 `.env` 文件中。
- 此文件已被 `.gitignore` 自动忽略，**请勿将其推送到公开 GitHub 仓库**。
- 部署到线上时，请根据对应云平台（如 Railway/Render）的 `Environment Variables` 模块手动填入参数。

## 🚀 快速启动

### 1. 环境准备
确保您的电脑已安装 [Node.js](https://nodejs.org/) (v18.0+) 和 [Docker](https://www.docker.com/)。

### 2. 本地快速运行
1. 复制环境模板：`cp .env.example .env` (按需修改 `.env` 中的管理员名单)。
2. 运行指令：
```bash
# 安装依赖
npm install

# 启动服务
node server.js
```
看到“服务端已启动”后，双击打开 `index.html` 即可使用。

### 3. Docker 容器化运行
如果您已安装 Docker，可一键完成部署：
```bash
docker-compose up -d --build
```

## 🛠️ GitHub 部署工作流
如果您想发布并投入使用：
1. **创建仓库**：在 GitHub 上新建名为 `credit-progress` 的私有/公开仓库。
2. **推送代码**：
```bash
git init
git add .
git commit -m "feat: 初版发布，接入全栈后端与环境隔离"
git remote add origin [您的仓库地址]
git push -u origin main
```
3. **线上部署推荐**：
   - 推荐使用 **[Railway](https://railway.app/)**。
   - 在控制台添加环境变量 `ADMIN_NAMES` 和 `PORT`。
   - 挂载 **Persistent Volume (宿主机卷)** 到 `/app/database.json` 以确保持久化。

## 📏 认定细则
详细计算标准及备注已内置于系统的“认定细则”界面中。
