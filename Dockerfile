# 使用轻量级 Node.js 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖配置并安装
COPY package*.json ./
RUN npm install

# 复制项目所有文件
COPY . .

# 暴露后端端口
EXPOSE 3000

# 启动服务器
CMD ["node", "server.js"]
