@echo off
echo ========================================
echo   Learnly Database Schema Fix
echo ========================================
echo.
echo This script will fix all database schema issues...
echo.

REM Fix Users table
echo Adding missing columns to users table...
docker exec learnly_postgres psql -U learnly_user -d learnly_db -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS semester INTEGER; ALTER TABLE users ADD COLUMN IF NOT EXISTS degree_type VARCHAR; ALTER TABLE users ADD COLUMN IF NOT EXISTS competency_score INTEGER DEFAULT 50;"

REM Fix Courses table
echo Adding missing columns to courses table...
docker exec learnly_postgres psql -U learnly_user -d learnly_db -c "ALTER TABLE courses ADD COLUMN IF NOT EXISTS semester INTEGER; ALTER TABLE courses ADD COLUMN IF NOT EXISTS degree_types VARCHAR;"

echo.
echo ========================================
echo   Database schema updated successfully!
echo ========================================
echo.
echo Restarting backend...
docker-compose restart backend

echo.
echo ========================================
echo   All done! Backend restarted.
echo ========================================
echo.
echo You can now use the application.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo.
pause
