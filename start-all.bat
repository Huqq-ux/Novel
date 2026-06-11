@echo off
REM 墨语小说微服务一键启动（Windows CMD）
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
set LOG_DIR=%ROOT_DIR%logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

if "%1"=="stop" goto :stop
if "%1"=="status" goto :status

echo === 墨语小说微服务启动 ===

REM 检查 Nacos
curl -s -o nul -w "%%{http_code}" http://localhost:8848/nacos/ | findstr "200" >nul
if errorlevel 1 (
    echo [WARN] Nacos not running. Start with: docker-compose up -d nacos mysql redis
    exit /b 1
)

REM 安装公共模块
echo [INFO] Building novel-common...
call "%ROOT_DIR%mvnw.cmd" clean install -pl novel-common -DskipTests -q

REM 启动所有服务（后台）
echo [INFO] Starting all services...
for %%S in (novel-user-service novel-book-service novel-payment-service novel-reading-service novel-interaction-service novel-admin-service novel-gateway) do (
    echo   Starting %%S...
    start "%%S" /MIN cmd /c "call %ROOT_DIR%mvnw.cmd spring-boot:run -pl %%S -DskipTests > %LOG_DIR%\%%S.log 2>&1"
    timeout /t 3 >nul
)

echo === 所有服务启动完成 ===
echo 端口: Gateway:8080 User:8081 Book:8082 Read:8083 Interact:8084 Pay:8085 Admin:8086
echo 日志: %LOG_DIR%
echo 停止: start-all.bat stop
goto :eof

:stop
echo 停止所有服务...
for %%S in (novel-gateway novel-admin-service novel-interaction-service novel-reading-service novel-payment-service novel-book-service novel-user-service) do (
    for /f "tokens=2" %%P in ('tasklist /fi "WINDOWTITLE eq %%S" ^| findstr "java"') do (
        taskkill /PID %%P /F 2>nul
        echo   Stopped %%S
    )
)
echo 已停止。
goto :eof

:status
echo 服务状态 - 检查 http://localhost:8080/actuator/health
curl -s http://localhost:8080/actuator/health 2>nul || echo Gateway not accessible
goto :eof
