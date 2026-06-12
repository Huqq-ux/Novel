@echo off
chcp 65001 >nul
title 土豆小说 - 一键启动

echo ========================================
echo   土豆小说微服务 - 开发环境一键启动
echo ========================================
echo.

:: ==========================================
:: 1. 环境检查
:: ==========================================
echo [1/5] 检查环境...

java -version 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Java，请安装 JDK 17+
    pause
    exit /b 1
)

node -v 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js
    pause
    exit /b 1
)

:: 检查 Nacos
curl -s http://localhost:8848/nacos/v1/ns/operator/metrics 2>nul | findstr "UP" >nul
if %errorlevel% neq 0 (
    echo [警告] Nacos 未运行，请先启动: docker-compose up -d nacos
)

:: 检查 MySQL
mysqladmin ping -h localhost -u root -p123456 2>nul
if %errorlevel% neq 0 (
    echo [警告] MySQL 未运行或密码不正确
)

echo 环境检查完成.
echo.

:: ==========================================
:: 2. 安装公共模块
:: ==========================================
echo [2/5] 安装 novel-common 公共模块...
call mvnw.cmd clean install -pl novel-common -DskipTests -q
if %errorlevel% neq 0 (
    echo [错误] novel-common 编译失败
    pause
    exit /b 1
)
echo novel-common 安装完成.
echo.

:: ==========================================
:: 3. 启动微服务（后台运行）
:: ==========================================
echo [3/5] 启动微服务...

:: 用户服务 :8081
start "novel-user-service" cmd /c "title novel-user-service:8081 && mvnw.cmd spring-boot:run -pl novel-user-service -DskipTests"

:: 书籍服务 :8082
start "novel-book-service" cmd /c "title novel-book-service:8082 && mvnw.cmd spring-boot:run -pl novel-book-service -DskipTests"

:: 阅读服务 :8083
start "novel-reading-service" cmd /c "title novel-reading-service:8083 && mvnw.cmd spring-boot:run -pl novel-reading-service -DskipTests"

:: 交互服务 :8084
start "novel-interaction-service" cmd /c "title novel-interaction-service:8084 && mvnw.cmd spring-boot:run -pl novel-interaction-service -DskipTests"

:: 支付服务 :8085
start "novel-payment-service" cmd /c "title novel-payment-service:8085 && mvnw.cmd spring-boot:run -pl novel-payment-service -DskipTests"

:: 管理服务 :8086
start "novel-admin-service" cmd /c "title novel-admin-service:8086 && mvnw.cmd spring-boot:run -pl novel-admin-service -DskipTests"

echo 微服务启动中，等待初始化...
echo.

:: ==========================================
:: 4. 启动 Gateway
:: ==========================================
echo [4/5] 等待服务就绪后启动 Gateway...

:: 等待所有服务健康检查通过
set /a count=0
:wait_services
timeout /t 5 /nobreak >nul
set /a count+=5
set /a ready=0

curl -s -o nul -w "%%{http_code}" http://localhost:8081/actuator/health 2>nul | findstr "200" >nul && set /a ready+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8082/actuator/health 2>nul | findstr "200" >nul && set /a ready+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8083/actuator/health 2>nul | findstr "200" >nul && set /a ready+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8084/actuator/health 2>nul | findstr "200" >nul && set /a ready+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8085/actuator/health 2>nul | findstr "200" >nul && set /a ready+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8086/actuator/health 2>nul | findstr "200" >nul && set /a ready+=1

echo    等待中... (%ready%/6 服务就绪, 已等待 %count%s^)

if %ready% lss 6 (
    if %count% lss 120 goto wait_services
    echo [警告] 部分服务启动超时，继续启动 Gateway
)

start "novel-gateway" cmd /c "title novel-gateway:8090 && mvnw.cmd spring-boot:run -pl novel-gateway -DskipTests"

:: 等待 Gateway
timeout /t 10 /nobreak >nul
echo.

:: ==========================================
:: 5. 启动前端
:: ==========================================
echo [5/5] 启动前端...
cd frontend
start "novel-frontend" cmd /c "title novel-frontend:3000 && npm run dev"
cd ..

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo   前端:    http://localhost:3000
echo   Gateway: http://localhost:8090
echo   Nacos:   http://localhost:8848/nacos
echo.
echo   关闭所有服务: 运行 stop-dev.bat
echo ========================================
echo.
pause
