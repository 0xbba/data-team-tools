@echo off
set PGPORT=5432
set PGUSER=dtapp
set PGPASSWORD=dtapp123
set PGDATABASE=data_team_tools
set PGSCHEMA=public
set PATH=%PATH%;C:\Users\Administrator\.local\share\TeleAgent\runtimes\node
cd /d "%~dp0"
node server.js
pause
