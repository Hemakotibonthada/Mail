@echo off
echo ====================================
echo Circuvent Mail - Initial Setup
echo ====================================
echo.

echo [1/5] Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install root dependencies
    exit /b 1
)

echo.
echo [2/5] Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install server dependencies
    exit /b 1
)

echo.
echo [3/5] Installing client dependencies...
cd ..\client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install client dependencies
    exit /b 1
)

cd ..

echo.
echo [4/5] Checking environment configuration...
if not exist "server\.env" (
    echo WARNING: server\.env not found
    echo Please copy server\.env.example to server\.env and configure it
    copy server\.env.example server\.env
    echo Created server\.env from template - PLEASE EDIT IT WITH YOUR CREDENTIALS
) else (
    echo server\.env found
)

echo.
echo [5/5] Setup complete!
echo.
echo ====================================
echo Next Steps:
echo ====================================
echo 1. Edit server\.env with your Firebase credentials
echo 2. Run: firebase login
echo 3. Run: firebase deploy --only firestore:rules,firestore:indexes,storage
echo 4. Create admin user in Firebase Console
echo 5. Run: npm run dev
echo.
echo See QUICKSTART.md for detailed instructions
echo ====================================
pause
