#!/bin/bash

echo "🧪 运行测试..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 确保服务正在运行
if ! docker compose ps | grep -q "Up"; then
    echo "⚠️  服务未运行，正在启动..."
    docker compose up -d
    sleep 10
fi

echo ""
echo "📊 测试后端 API..."

# 测试健康检查
echo -n "  健康检查: "
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

# 测试订单 API
echo -n "  订单 API: "
if curl -f http://localhost:8000/api/v1/orders > /dev/null 2>&1; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

# 测试资源 API
echo -n "  资源 API: "
if curl -f http://localhost:8000/api/v1/resources > /dev/null 2>&1; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

# 测试物料 API
echo -n "  物料 API: "
if curl -f http://localhost:8000/api/v1/materials > /dev/null 2>&1; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

echo ""
echo "🌐 测试前端..."

echo -n "  前端访问: "
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

echo ""
echo "🗄️  测试数据库..."

echo -n "  PostgreSQL 连接: "
if docker compose exec -T postgres psql -U postgres -d ai_aps -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

echo -n "  数据表检查: "
TABLE_COUNT=$(docker compose exec -T postgres psql -U postgres -d ai_aps -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" | tr -d ' ')
if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ 通过 ($TABLE_COUNT 个表)"
else
    echo "❌ 失败"
fi

echo ""
echo "📦 测试 Redis..."

echo -n "  Redis 连接: "
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

echo ""
echo "⚙️  测试 Celery..."

echo -n "  Celery Worker: "
if docker compose logs celery-worker | grep -q "ready"; then
    echo "✅ 运行中"
else
    echo "⚠️  可能未就绪"
fi

echo ""
echo "✅ 测试完成！"
