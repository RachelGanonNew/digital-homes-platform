@echo off
echo 🏠 Digital Homes Platform - Hackathon Demo
echo ==========================================

echo.
echo 📦 Installing dependencies...
call npm install
cd backend && call npm install
cd ../frontend && call npm install
cd ../ai-valuation && pip install -r requirements.txt
cd ..

echo.
echo 🔧 Setting up environment files...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo ⚠️  Backend .env created - configure if needed
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
    echo ⚠️  Frontend .env created - configure if needed
)

echo.
echo 🚀 Starting Digital Homes Platform...
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo AI Service: http://localhost:5001
echo.
echo Press Ctrl+C to stop all services
echo.

start "AI Service" cmd /k "cd ai-valuation && python app.py"
timeout /t 3 /nobreak >nul
start "Backend API" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm start"

echo ✅ All services started!
echo 🎯 Open http://localhost:3000 to see the demo
pause
