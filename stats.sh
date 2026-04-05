#!/bin/bash

echo "📊 AI-APS 项目统计"
echo "===================="
echo ""

# 统计代码文件
echo "📁 文件统计:"
echo "  Python 文件: $(find . -name "*.py" ! -path "*/node_modules/*" ! -path "*/__pycache__/*" | wc -l | tr -d ' ')"
echo "  TypeScript 文件: $(find . -name "*.ts" -o -name "*.tsx" ! -path "*/node_modules/*" | wc -l | tr -d ' ')"
echo "  配置文件: $(find . -name "*.yml" -o -name "*.yaml" -o -name "*.json" ! -path "*/node_modules/*" | wc -l | tr -d ' ')"
echo "  文档文件: $(find . -name "*.md" | wc -l | tr -d ' ')"
echo ""

# 统计代码行数
echo "📝 代码行数:"
if command -v cloc &> /dev/null; then
    cloc --quiet --exclude-dir=node_modules,__pycache__,.git,dist .
else
    echo "  (安装 cloc 工具可查看详细统计)"
    echo "  Python: $(find . -name "*.py" ! -path "*/node_modules/*" ! -path "*/__pycache__/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')"
    echo "  TypeScript: $(find . -name "*.ts" -o -name "*.tsx" ! -path "*/node_modules/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')"
fi
echo ""

# Docker 统计
echo "🐳 Docker 服务:"
if docker compose ps &> /dev/null; then
    docker compose ps
else
    echo "  服务未运行"
fi
echo ""

# 数据库统计
echo "🗄️  数据库统计:"
if docker compose ps | grep -q "postgres.*Up"; then
    echo "  表数量: $(docker compose exec -T postgres psql -U postgres -d ai_aps -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')"
    echo "  订单数: $(docker compose exec -T postgres psql -U postgres -d ai_aps -t -c "SELECT COUNT(*) FROM orders" 2>/dev/null | tr -d ' ')"
    echo "  资源数: $(docker compose exec -T postgres psql -U postgres -d ai_aps -t -c "SELECT COUNT(*) FROM resources" 2>/dev/null | tr -d ' ')"
    echo "  排产结果: $(docker compose exec -T postgres psql -U postgres -d ai_aps -t -c "SELECT COUNT(*) FROM schedules" 2>/dev/null | tr -d ' ')"
else
    echo "  数据库未运行"
fi
echo ""

echo "✅ 统计完成"
