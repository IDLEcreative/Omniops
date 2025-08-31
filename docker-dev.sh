#!/bin/bash

# Docker Development Environment Management Script
# Usage: ./docker-dev.sh [command]

set -e

DOCKER_DIR="./docker"
COMPOSE_FILE="docker-compose.dev.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Docker Development Environment${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_status() {
    echo -e "${YELLOW}➤${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_docker() {
    if ! docker info &>/dev/null; then
        print_error "Docker is not running. Starting Docker Desktop..."
        open -a "Docker"
        echo "Waiting for Docker to start..."
        while ! docker info &>/dev/null; do
            sleep 2
        done
        print_success "Docker is running"
    else
        print_success "Docker is already running"
    fi
}

start_services() {
    print_header
    check_docker
    
    print_status "Starting Redis service..."
    cd "$DOCKER_DIR"
    docker compose -f "$COMPOSE_FILE" up -d redis
    
    print_status "Waiting for Redis to be healthy..."
    for i in {1..30}; do
        if docker exec scraper-redis redis-cli ping &>/dev/null; then
            print_success "Redis is healthy and responding"
            break
        fi
        sleep 1
    done
    
    print_status "Services status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    print_success "Development environment is ready!"
    echo "Redis is available at: redis://localhost:6379"
}

stop_services() {
    print_header
    print_status "Stopping all services..."
    cd "$DOCKER_DIR"
    docker compose -f "$COMPOSE_FILE" down
    print_success "All services stopped"
}

restart_services() {
    stop_services
    echo ""
    start_services
}

status_services() {
    print_header
    print_status "Current service status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    print_status "Redis health check:"
    if docker exec scraper-redis redis-cli ping &>/dev/null; then
        print_success "Redis is healthy"
    else
        print_error "Redis is not responding"
    fi
}

logs_services() {
    print_header
    print_status "Showing logs (Ctrl+C to exit)..."
    cd "$DOCKER_DIR"
    docker compose -f "$COMPOSE_FILE" logs -f
}

clean_all() {
    print_header
    print_status "Cleaning up all containers and volumes..."
    cd "$DOCKER_DIR"
    docker compose -f "$COMPOSE_FILE" down -v
    docker system prune -f
    print_success "Cleanup complete"
}

# Main script logic
case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        status_services
        ;;
    logs)
        logs_services
        ;;
    clean)
        clean_all
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start    - Start Redis and other required services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - Show service logs"
        echo "  clean    - Clean up all containers and volumes"
        exit 1
        ;;
esac