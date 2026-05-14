#!/bin/bash
# BrewYuKoLi 开发服务器启动脚本
# 支持 HTTPS + 热更新 + 自动重载

set -euo pipefail

PROJECT_DIR="/app"
LOG_DIR="/var/log/brew-dev"
PID_FILE="$LOG_DIR/dev-server.pid"

# 日志目录
mkdir -p "$LOG_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]: $1${NC}"
}

error() {
    echo -e "${RED}[ERROR]: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN]: $1${NC}"
}

# 检查依赖
check_dependencies() {
    log "检查开发环境依赖..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm 未安装"
        exit 1
    fi
    
    success "依赖检查完成"
}

# 清理旧进程
cleanup() {
    log "清理旧进程..."
    
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log "停止旧进程 $OLD_PID"
            kill "$OLD_PID" || true
        fi
        rm -f "$PID_FILE"
    fi
    
    # 清理端口占用
    lsof -ti:3099 | xargs kill -9 2>/dev/null || true
    lsof -ti:3443 | xargs kill -9 2>/dev/null || true
}

# 构建项目
build_project() {
    log "构建项目..."
    
    cd "$PROJECT_DIR"
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        log "安装依赖..."
        npm ci
    fi
    
    # 构建 CSS
    log "构建 CSS..."
    npm run build:css
    
    # SSG 构建
    log "SSG 构建..."
    node scripts/build-ssg.js
    
    success "项目构建完成"
}

# 启动开发服务器
start_dev_server() {
    log "启动开发服务器..."
    
    cd "$PROJECT_DIR"
    
    # 启动 Express 服务器
    nohup npm run dev > "$LOG_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PID_FILE"
    
    # 等待服务器启动
    sleep 3
    
    if ps -p "$SERVER_PID" > /dev/null 2>&1; then
        success "开发服务器已启动 (PID: $SERVER_PID)"
        log "HTTP: http://localhost:3099"
        log "HTTPS: https://localhost:3443"
        log "健康检查: http://localhost:3099/health"
    else
        error "开发服务器启动失败"
        cat "$LOG_DIR/server.log"
        exit 1
    fi
}

# 启动文件监控 (热更新)
start_file_monitor() {
    log "启动文件监控..."
    
    cd "$PROJECT_DIR"
    
    # 监控 src/ 目录变化
    nohup fswatch -o src/ | xargs -n1 -I{} bash -c 'log "检测到文件变化，重新构建..."; npm run build' > "$LOG_DIR/watch.log" 2>&1 &
    MONITOR_PID=$!
    
    success "文件监控已启动 (PID: $MONITOR_PID)"
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    if curl -f http://localhost:3099/health > /dev/null 2>&1; then
        success "健康检查通过"
    else
        warn "健康检查失败，等待服务器启动..."
        sleep 5
        if curl -f http://localhost:3099/health > /dev/null 2>&1; then
            success "健康检查通过"
        else
            error "健康检查失败，服务器可能有问题"
            exit 1
        fi
    fi
}

# 主函数
main() {
    log "BrewYuKoLi 开发服务器启动脚本"
    log "=================================="
    
    check_dependencies
    cleanup
    build_project
    start_dev_server
    start_file_monitor
    health_check
    
    success "开发环境启动完成！"
    
    # 保持脚本运行
    tail -f "$LOG_DIR/server.log"
}

# 信号处理
trap 'log "收到中断信号，清理进程..."; cleanup; exit 0' INT TERM

# 运行主函数
main "$@"