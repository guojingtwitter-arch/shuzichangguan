@echo off
cd /d "%~dp0"
set PORT=4173
"D:\ai_tools\node-v24.14.0-win-x64\node.exe" "%~dp0serve-dist.js"
