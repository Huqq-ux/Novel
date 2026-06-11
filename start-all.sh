#!/bin/bash
# 墨语小说微服务一键启动脚本（开发环境）
# 所有服务在后台启动，日志输出到 logs/ 目录

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
MVNW="$ROOT_DIR/mvnw"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

start_service() {
    local name=$1
    local log_file="$LOG_DIR/${name}.log"
    log_info "Starting $name..."
    nohup "$MVNW" spring-boot:run -pl "$name" -DskipTests > "$log_file" 2>&1 &
    echo $! > "$LOG_DIR/${name}.pid"
    sleep 2
    if kill -0 $(cat "$LOG_DIR/${name}.pid") 2>/dev/null; then
        log_info "$name started (PID: $(cat "$LOG_DIR/${name}.pid"))"
    else
        log_error "$name failed to start, check $log_file"
    fi
}

stop_service() {
    local name=$1
    local pid_file="$LOG_DIR/${name}.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_warn "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null
            wait "$pid" 2>/dev/null || true
        fi
        rm -f "$pid_file"
    fi
}

stop_all() {
    log_warn "Stopping all services..."
    stop_service "novel-gateway"
    stop_service "novel-admin-service"
    stop_service "novel-interaction-service"
    stop_service "novel-reading-service"
    stop_service "novel-payment-service"
    stop_service "novel-book-service"
    stop_service "novel-user-service"
    log_info "All services stopped."
}

case "${1:-start}" in
    start)
        mkdir -p "$LOG_DIR"

        log_info "=== 墨语小说微服务启动 ==="

        # 1. 检查基础设施
        log_info "检查 Nacos..."
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8848/nacos/ | grep -q 200; then
            log_info "Nacos is running."
        else
            log_warn "Nacos is not running. Start with: docker-compose up -d nacos mysql redis"
            echo "      然后重新运行此脚本。"
            exit 1
        fi

        # 2. 安装公共模块
        log_info "Building novel-common..."
        "$MVNW" clean install -pl novel-common -DskipTests -q

        # 3. 按依赖顺序启动微服务
        # 无依赖的先启动
        start_service "novel-user-service"
        start_service "novel-book-service"

        # 等待基础服务就绪
        sleep 5

        # 依赖基础服务的
        start_service "novel-payment-service"
        start_service "novel-reading-service"
        start_service "novel-interaction-service"

        sleep 3

        # 聚合服务最后启动
        start_service "novel-admin-service"

        # 网关最后启动
        sleep 3
        start_service "novel-gateway"

        echo ""
        log_info "=== 所有服务启动完成 ==="
        echo ""
        echo "  服务列表:"
        echo "  ┌──────────────────────────┬───────┐"
        echo "  │ novel-gateway            │ 8080  │"
        echo "  │ novel-user-service       │ 8081  │"
        echo "  │ novel-book-service       │ 8082  │"
        echo "  │ novel-reading-service    │ 8083  │"
        echo "  │ novel-interaction-service│ 8084  │"
        echo "  │ novel-payment-service    │ 8085  │"
        echo "  │ novel-admin-service      │ 8086  │"
        echo "  └──────────────────────────┴───────┘"
        echo ""
        echo "  日志目录: $LOG_DIR"
        echo "  查看日志: tail -f $LOG_DIR/*.log"
        echo "  停止服务: bash start-all.sh stop"
        ;;

    stop)
        stop_all
        ;;

    restart)
        "$0" stop
        sleep 3
        "$0" start
        ;;

    status)
        echo "服务状态:"
        for name in novel-gateway novel-admin-service novel-interaction-service novel-reading-service novel-payment-service novel-book-service novel-user-service; do
            pid_file="$LOG_DIR/${name}.pid"
            if [ -f "$pid_file" ]; then
                pid=$(cat "$pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    echo "  ${GREEN}●${NC} $name (PID: $pid)"
                else
                    echo "  ${RED}○${NC} $name (stopped)"
                fi
            else
                echo "  ${YELLOW}−${NC} $name (not started)"
            fi
        done
        ;;

    *)
        echo "用法: bash start-all.sh [start|stop|restart|status]"
        echo "  start   - 启动所有微服务（默认）"
        echo "  stop    - 停止所有微服务"
        echo "  restart - 重启所有微服务"
        echo "  status  - 查看服务状态"
        ;;
esac
