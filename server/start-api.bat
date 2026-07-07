@echo off
powershell -NoProfile -Command "& { $env:PATH = $env:PATH + ';C:\Users\Administrator\.local\share\TeleAgent\runtimes\node'; $env:PGPORT = '8232'; Set-Location \"%~dp0.\"; node server.js }"
