@echo off
echo ============================================
echo  LEARNLY - Virtual AI Co-Instructor
echo ============================================
echo.

echo [1/5] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running.
    echo Please install Docker Desktop from https://www.docker.com/
    pause
    exit /b 1
)
echo Docker is installed ✓
echo.

echo [2/5] Checking environment file...
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file and set your configuration!
    echo - Change JWT_SECRET to a secure random string
    echo - Add Google OAuth credentials if needed
    echo.
    pause
)
echo Environment file exists ✓
echo.

echo [3/5] Starting Docker containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start containers
    pause
    exit /b 1
)
echo Containers started ✓
echo.

echo [4/5] Waiting for services to be ready...
timeout /t 10 /nobreak >nul
echo Services should be ready ✓
echo.

echo [5/5] Pulling Ollama models (this may take 10-20 minutes)...
echo This only needs to be done once.
echo.
set /p pull_models="Pull Ollama models now? (y/n): "
if /i "%pull_models%"=="y" (
    echo Pulling llama3.2...
    docker exec -it learnly_ollama ollama pull llama3.2
    echo.
    echo Pulling nomic-embed-text...
    docker exec -it learnly_ollama ollama pull nomic-embed-text
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
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:3000
