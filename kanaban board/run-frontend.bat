@echo off
title Kanban Frontend Client
cd client
echo Installing client dependencies...
call npm install
echo Starting frontend dev client on http://localhost:5173...
npm run dev
pause
