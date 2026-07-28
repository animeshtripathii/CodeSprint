@echo off
title Kanban Backend Server
cd server
echo Installing server dependencies...
call npm install
echo Starting backend server on http://localhost:5000...
npm run dev
pause
