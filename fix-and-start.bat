@echo off
echo ============================================
echo  LEARNLY - Fix and Start Script
echo ============================================
echo.

echo [Step 1/7] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running.
    echo Please install Docker Desktop from https://www.docker.com/
    pause
    exit /b 1
)
echo Docker is installed ✓
echo.

echo [Step 2/7] Checking/Creating .env file...
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: .env file created!
    echo The default configuration should work for local development.
    echo.
) else (
    echo .env file already exists ✓
)
echo.

echo [Step 3/7] Stopping existing containers...
docker-compose down
echo Containers stopped ✓
echo.

echo [Step 4/7] Removing old volumes (optional)...
set /p remove_volumes="Remove old volumes for fresh start? (y/n): "
if /i "%remove_volumes%"=="y" (
    docker volume rm learnly_postgres_data learnly_ollama_data learnly_backend_uploads learnly_frontend_node_modules 2>nul
    echo Volumes removed ✓
)
echo.

echo [Step 5/7] Rebuilding containers...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo ERROR: Failed to build containers
    pause
    exit /b 1
)
echo Containers rebuilt ✓
echo.

echo [Step 6/7] Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start containers
    pause
    exit /b 1
)
echo Services started ✓
echo.

echo [Step 7/7] Waiting for services to initialize...
echo This may take 30-60 seconds...
timeout /t 30 /nobreak >nul

echo.
echo Checking service health...
docker-compose ps
echo.

echo [Optional] Pull Ollama models...
set /p pull_models="Pull Ollama models now? Required for AI features (y/n): "
if /i "%pull_models%"=="y" (
    echo.
    echo Pulling llama3.2 (this may take 10-20 minutes)...
    docker exec learnly_ollama ollama pull llama3.2
    echo.
    echo Pulling nomic-embed-text...
    docker exec learnly_ollama ollama pull nomic-embed-text
    echo.
    echo Models downloaded ✓
)
echo.

echo ============================================
echo  LEARNLY is now running!
echo ============================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo.
echo Troubleshooting:
echo - View logs: docker-compose logs -f
echo - Restart: docker-compose restart
echo - Stop: docker-compose down
echo.
echo Press any key to view logs...
pause >nul

docker-compose logs -f
