# Makefile for AI-APS

.PHONY: help start stop restart logs test clean build deploy

help:
	@echo "AI-APS 智能排产系统 - 可用命令:"
	@echo ""
	@echo "  make start       - 启动所有服务"
	@echo "  make stop        - 停止所有服务"
	@echo "  make restart     - 重启所有服务"
	@echo "  make logs        - 查看日志"
	@echo "  make test        - 运行测试"
	@echo "  make clean       - 清理容器和数据卷"
	@echo "  make build       - 构建 Docker 镜像"
	@echo "  make deploy      - 部署到生产环境"
	@echo "  make seed        - 创建测试数据"
	@echo "  make shell       - 进入后端容器 shell"
	@echo "  make db-shell    - 进入数据库 shell"
	@echo ""

start:
	@echo "🚀 启动服务..."
	./start.sh

stop:
	@echo "🛑 停止服务..."
	./stop.sh

restart: stop start

logs:
	@echo "📋 查看日志..."
	docker compose logs -f

test:
	@echo "🧪 运行测试..."
	./test.sh

clean:
	@echo "🧹 清理资源..."
	docker compose down -v
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	rm -rf backend/.pytest_cache
	rm -f backend/test.db

build:
	@echo "🔨 构建镜像..."
	docker compose build

deploy:
	@echo "🚀 部署到生产环境..."
	docker compose -f docker compose.prod.yml up -d --build

seed:
	@echo "📝 创建测试数据..."
	docker compose exec backend python seed_data.py

shell:
	@echo "💻 进入后端容器..."
	docker compose exec backend /bin/bash

db-shell:
	@echo "🗄️  进入数据库..."
	docker compose exec postgres psql -U postgres -d ai_aps

backend-logs:
	docker compose logs -f backend

frontend-logs:
	docker compose logs -f frontend

celery-logs:
	docker compose logs -f celery-worker
