#!/bin/bash

echo "🚀 启动 AI-APS 智能排产系统..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 停止并删除旧容器
echo "📦 清理旧容器..."
docker compose down

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker compose ps

# 等待后端健康检查通过
echo "🏥 等待后端服务就绪..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ 后端服务已就绪"
        break
    fi
    attempt=$((attempt + 1))
    echo "   尝试 $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ 后端服务启动超时"
    echo "查看日志: docker compose logs backend"
    exit 1
fi

# 创建测试数据
echo "📝 创建测试数据..."
docker compose exec -T backend python seed_data.py

echo ""
echo "✅ 系统启动完成！"
echo ""
echo "📍 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端 API: http://localhost:8000"
echo "   API 文档: http://localhost:8000/docs"
echo ""
echo "📋 常用命令："
echo "   查看日志: docker compose logs -f [service_name]"
echo "   停止服务: docker compose down"
echo "   重启服务: docker compose restart [service_name]"
echo ""
