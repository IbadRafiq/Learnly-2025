@echo off
echo ======================================
echo Fixing Database Foreign Key Constraints
echo ======================================
echo.
echo This will add CASCADE DELETE to foreign keys
echo so that deleting users and courses will work properly.
echo.
pause

cd backend
python run_cascade_migration.py

echo.
echo ======================================
echo Migration Complete!
echo ======================================
echo.
echo You can now delete users and courses without errors.
echo Please restart the backend server.
echo.
pause
