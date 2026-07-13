@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -Command "& {$s='%~dp0install-chromium-plugin.ps1'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; $scriptDir='%~dp0'; $scriptDir=$scriptDir.TrimEnd('\'); iex (Get-Content $s -Raw -Encoding UTF8)}"
pause
