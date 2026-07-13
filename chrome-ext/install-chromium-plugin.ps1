# ============================================================
# 数据需求台账助手 - 浏览器插件安装向导
# ============================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if (-not $scriptDir) { $scriptDir = $PSScriptRoot }
    if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
}
$extDir = Join-Path $scriptDir "ledger-assistant"

if (-not (Test-Path (Join-Path $extDir "manifest.json"))) {
    Write-Host ""
    Write-Host "  [错误] 未找到插件目录: $extDir" -ForegroundColor Red
    Write-Host ""
    Read-Host "按回车退出"; exit 1
}

# ============================================================
# 扫描 Chromium 系浏览器 (Molan / Edge / Chrome / Chromium)
# $Drives: 盘符数组，如 @("C") 或 @("C","D","E")
# ============================================================
$MIN_CHROMIUM_VERSION = 114

function Find-Browsers {
    param([string[]]$Drives = @("C"))

    $browsers = @()
    $found = @{}

    foreach ($drive in $Drives) {
        $driveRoot = "${drive}:\"
        if (-not (Test-Path $driveRoot)) { continue }

        # --- 收集该盘所有用户的 AppData\Local ---
        $searchPaths = @()
        $usersDir = Join-Path $driveRoot "Users"
        if (Test-Path $usersDir) {
            Get-ChildItem $usersDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                $p = Join-Path $_.FullName "AppData\Local"
                if (Test-Path $p) { $searchPaths += $p }
            }
        }

        # --- Molan 浏览器 ---
        foreach ($root in $searchPaths) {
            Get-ChildItem $root -Directory -Filter "Molan*" -ErrorAction SilentlyContinue | ForEach-Object {
                $appDir = Join-Path $_.FullName "Application"
                if (Test-Path $appDir) {
                    $exe = Get-ChildItem $appDir -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue |
                           Where-Object { $_.Name -match "molan" } | Select-Object -First 1
                    if (-not $exe) {
                        $exe = Get-ChildItem $_.FullName -Filter "*.exe" -Depth 2 -ErrorAction SilentlyContinue |
                               Where-Object { $_.Name -match "molan" } | Select-Object -First 1
                    }
                    $version = ""
                    Get-ChildItem $appDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                        if ($_.Name -match "^\d") { $version = $_.Name }
                    }
                    $key = "Molan:$($_.FullName)"
                    if (-not $found[$key]) {
                        $found[$key] = $true
                        $displayName = $_.Name
                        if ($version) { $displayName += " (v$version)" }
                        $majorVer = 0
                        if ($version -match "^(\d+)") { $majorVer = [int]$Matches[1] }
                        else {
                            if ($exe -and (Test-Path $exe.FullName)) {
                                $fv = (Get-Item $exe.FullName).VersionInfo.FileVersion
                                if ($fv -match "^(\d+)") { $majorVer = [int]$Matches[1] }
                            }
                        }
                        $browsers += [PSCustomObject]@{
                            Name      = $displayName
                            ExePath   = if ($exe) { $exe.FullName } else { "" }
                            MajorVer  = $majorVer
                            Supported = ($majorVer -ge $MIN_CHROMIUM_VERSION)
                        }
                    }
                }
            }
        }

        # --- Microsoft Edge ---
        $edgePaths = @(
            (Join-Path $driveRoot "Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
            (Join-Path $driveRoot "Program Files\Microsoft\Edge\Application\msedge.exe")
        )
        foreach ($p in $edgePaths) {
            if ((Test-Path $p) -and -not $found['Edge']) {
                $found['Edge'] = $true
                $ver = (Get-Item $p).VersionInfo.FileVersion
                $majorVer = 0
                if ($ver -match "^(\d+)") { $majorVer = [int]$Matches[1] }
                $displayName = "Microsoft Edge"
                if ($ver) { $displayName += " (v$ver)" }
                $browsers += [PSCustomObject]@{
                    Name      = $displayName
                    ExePath   = $p
                    MajorVer  = $majorVer
                    Supported = ($majorVer -ge $MIN_CHROMIUM_VERSION)
                }
                break
            }
        }

        # --- Google Chrome ---
        $chromePaths = @(
            (Join-Path $driveRoot "Program Files (x86)\Google\Chrome\Application\chrome.exe"),
            (Join-Path $driveRoot "Program Files\Google\Chrome\Application\chrome.exe")
        )
        foreach ($p in $chromePaths) {
            if ((Test-Path $p) -and -not $found['Chrome']) {
                $found['Chrome'] = $true
                $ver = (Get-Item $p).VersionInfo.FileVersion
                $majorVer = 0
                if ($ver -match "^(\d+)") { $majorVer = [int]$Matches[1] }
                $displayName = "Google Chrome"
                if ($ver) { $displayName += " (v$ver)" }
                $browsers += [PSCustomObject]@{
                    Name      = $displayName
                    ExePath   = $p
                    MajorVer  = $majorVer
                    Supported = ($majorVer -ge $MIN_CHROMIUM_VERSION)
                }
                break
            }
        }

        # --- Chromium ---
        foreach ($root in $searchPaths) {
            $chromiumApp = Join-Path $root "Chromium\Application"
            if (Test-Path $chromiumApp) {
                $exe = Get-ChildItem $chromiumApp -Filter "chrome.exe" -Recurse -ErrorAction SilentlyContinue |
                       Select-Object -First 1
                if ($exe -and -not $found['Chromium']) {
                    $found['Chromium'] = $true
                    $ver = ""
                    Get-ChildItem $chromiumApp -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                        if ($_.Name -match "^\d") { $ver = $_.Name }
                    }
                    $majorVer = 0
                    if ($ver -match "^(\d+)") { $majorVer = [int]$Matches[1] }
                    else {
                        $fv = (Get-Item $exe.FullName).VersionInfo.FileVersion
                        if ($fv -match "^(\d+)") { $majorVer = [int]$Matches[1] }
                    }
                    $displayName = "Chromium"
                    if ($ver) { $displayName += " (v$ver)" }
                    $browsers += [PSCustomObject]@{
                        Name      = $displayName
                        ExePath   = $exe.FullName
                        MajorVer  = $majorVer
                        Supported = ($majorVer -ge $MIN_CHROMIUM_VERSION)
                    }
                }
            }
        }
    }

    return $browsers
}

# ============================================================
# 获取所有可用盘符
# ============================================================
function Get-AvailableDrives {
    $drives = @()
    Get-WmiObject Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
        $drives += $_.DeviceID.Substring(0,1)
    }
    return ($drives | Sort-Object)
}

# ============================================================
# 清空控制台输入缓冲区（同时消费 KeyDown 和 KeyUp 事件）
# ============================================================
function Clear-KeyBuffer {
    while ($Host.UI.RawUI.KeyAvailable) {
        $Host.UI.RawUI.ReadKey('IncludeKeyDown,IncludeKeyUp,NoEcho') | Out-Null
    }
}

# ============================================================
# 读取单字符选择
# ============================================================
function Read-Choice {
    param([string]$Prompt, [string[]]$ValidKeys)
    Clear-KeyBuffer
    while ($true) {
        Write-Host $Prompt -NoNewline
        $key = $Host.UI.RawUI.ReadKey('IncludeKeyDown,NoEcho')
        Clear-KeyBuffer
        $ch = $key.Character.ToString().ToUpper()
        Write-Host $ch
        if ($ValidKeys -contains $ch) { return $ch }
    }
}

# ============================================================
# 等待按任意键继续（替代 Read-Host，避免混用导致缓冲区残留）
# ============================================================
function Wait-AnyKey {
    param([string]$Message = "  按任意键继续...")
    Write-Host ""
    Write-Host $Message -ForegroundColor DarkGray
    Clear-KeyBuffer
    $Host.UI.RawUI.ReadKey('IncludeKeyDown,NoEcho') | Out-Null
    Clear-KeyBuffer
}

# ============================================================
# 读取一行文本输入（使用 ReadLine 避免与 ReadKey 混用）
# ============================================================
function Read-LineInput {
    param([string]$Prompt)
    # 先清空残留按键事件
    Clear-KeyBuffer
    Write-Host $Prompt -NoNewline
    $line = [Console]::In.ReadLine()
    return $line
}

# ============================================================
# 显示安装步骤（绿色）
# ============================================================
function Show-InstallSteps {
    param([string]$BrowserName = "浏览器")
    Write-Host "  安装步骤:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  1. 打开 $BrowserName" -ForegroundColor Green
    Write-Host "  2. 地址栏输入 chrome://extensions 回车" -ForegroundColor Green
    Write-Host "  3. 右上角打开「开发者模式」开关" -ForegroundColor Green
    Write-Host "  4. 点击左上角「加载已解压的扩展程序」" -ForegroundColor Green
    Write-Host "  5. 选择文件夹: $extDir" -ForegroundColor Green
    Write-Host "  6. 安装成功后会显示「数据需求台账助手」" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Token 配置: 主应用头像菜单 -> API Token -> 创建并复制 -> 插件设置页粘贴" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ──────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}

# ============================================================
# 主菜单
# ============================================================
function Show-MainMenu {
    while ($true) {
        Clear-Host
        Write-Host ""
        Write-Host "  ================================================" -ForegroundColor Cyan
        Write-Host "    数据需求台账助手 - 浏览器插件安装向导" -ForegroundColor Cyan
        Write-Host "  ================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  插件路径: $extDir" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  ──────────────────────────────────────────────" -ForegroundColor DarkGray
        Write-Host "  [1] " -ForegroundColor Yellow -NoNewline; Write-Host "扫描浏览器"
        Write-Host "  [2] " -ForegroundColor Yellow -NoNewline; Write-Host "查看安装方法"
        Write-Host "  [Q] " -ForegroundColor Yellow -NoNewline; Write-Host "退出"
        Write-Host "  ──────────────────────────────────────────────" -ForegroundColor DarkGray
        Write-Host ""

        $ch = Read-Choice "  请选择: " @('1','2','Q')
        switch ($ch) {
            '1' { Show-ScanMenu }
            '2' { Show-InstallGuide }
            'Q' { exit 0 }
        }
    }
}

# ============================================================
# 扫描浏览器 - 子菜单
# ============================================================
function Show-ScanMenu {
    while ($true) {
        $drives = Get-AvailableDrives
        $driveList = $drives -join ", "

        Clear-Host
        Write-Host ""
        Write-Host "  ────── 扫描浏览器 ──────" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  可用盘符: $driveList" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  [1] " -ForegroundColor Yellow -NoNewline; Write-Host "快速扫描（仅 C 盘常见位置，推荐）"
        Write-Host "  [2] " -ForegroundColor Yellow -NoNewline; Write-Host "指定盘符扫描"
        Write-Host "  [3] " -ForegroundColor Yellow -NoNewline; Write-Host "全盘扫描（所有盘符，较慢）"
        Write-Host "  [0] " -ForegroundColor Yellow -NoNewline; Write-Host "返回上级"
        Write-Host "  [Q] " -ForegroundColor Yellow -NoNewline; Write-Host "退出"
        Write-Host ""

        $ch = Read-Choice "  请选择: " @('1','2','3','0','Q')
        switch ($ch) {
            '1' {
                Write-Host "`n  正在扫描 C 盘..." -ForegroundColor Yellow
                $browsers = Find-Browsers -Drives @("C")
                Show-ScanResult $browsers
            }
            '2' {
                $driveInput = Read-LineInput "  请输入要扫描的盘符（多个用逗号分隔，如 C,D,E）: "
                $selectedDrives = $driveInput -split '[,，\s]+' | Where-Object { $_ -match '^[A-Za-z]$' } | ForEach-Object { $_.ToUpper() }
                if ($selectedDrives.Count -eq 0) {
                    Write-Host "`n  未输入有效盘符" -ForegroundColor Yellow
                    Wait-AnyKey
                } else {
                    Write-Host "  正在扫描 $($selectedDrives -join ', ') 盘..." -ForegroundColor Yellow
                    $browsers = Find-Browsers -Drives $selectedDrives
                    Show-ScanResult $browsers
                }
            }
            '3' {
                Write-Host "`n  正在扫描所有盘符 ($driveList)..." -ForegroundColor Yellow
                $browsers = Find-Browsers -Drives $drives
                Show-ScanResult $browsers
            }
            '0' { return }
            'Q' { exit 0 }
        }
    }
}

# ============================================================
# 扫描结果展示 + 选择浏览器
# ============================================================
function Show-ScanResult {
    param([array]$Browsers)

    Write-Host ""
    if ($Browsers.Count -eq 0) {
        Write-Host "  未检测到 Chromium 系浏览器 (Molan/Edge/Chrome/Chromium)" -ForegroundColor Yellow
        Write-Host "  可手动加载插件，路径: $extDir" -ForegroundColor Yellow
        Wait-AnyKey
        return
    }

    Write-Host "  检测到 $($Browsers.Count) 个浏览器 (要求 Chromium >= $MIN_CHROMIUM_VERSION):" -ForegroundColor Green
    Write-Host ""
    while ($true) {
        Clear-Host
        Write-Host ""
        Write-Host "  ────── 扫描结果 ──────" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  检测到 $($Browsers.Count) 个浏览器 (要求 Chromium >= $MIN_CHROMIUM_VERSION):" -ForegroundColor Green
        Write-Host ""
        for ($i = 0; $i -lt $Browsers.Count; $i++) {
            Write-Host "  [$($i+1)] " -ForegroundColor Yellow -NoNewline
            if ($Browsers[$i].Supported) {
                Write-Host $Browsers[$i].Name -ForegroundColor Green
            } else {
                Write-Host "$($Browsers[$i].Name)  [版本过低]" -ForegroundColor Red
            }
        }
        Write-Host "  [0] " -ForegroundColor Yellow -NoNewline; Write-Host "返回"
        Write-Host "  [Q] " -ForegroundColor Yellow -NoNewline; Write-Host "退出"
        Write-Host ""

        $validKeys = @(1..$Browsers.Count | ForEach-Object { "$_" }) + @('0','Q')
        $ch = Read-Choice "  请选择浏览器: " $validKeys
        if ($ch -eq '0') { return }
        if ($ch -eq 'Q') { exit 0 }
        $idx = [int]$ch - 1
        if ($idx -ge 0 -and $idx -lt $Browsers.Count) {
            Show-InstallMenu $Browsers[$idx]
        }
    }
}

# ============================================================
# 单个浏览器安装菜单
# ============================================================
function Show-InstallMenu {
    param([PSCustomObject]$Browser)
    while ($true) {
        Clear-Host
        Write-Host ""
        Write-Host "  ────── $($Browser.Name) ──────" -ForegroundColor Cyan
        Write-Host ""
        Show-InstallSteps $Browser.Name
        Write-Host "  [1] " -ForegroundColor Yellow -NoNewline; Write-Host "打开浏览器扩展页面"
        Write-Host "  [2] " -ForegroundColor Yellow -NoNewline; Write-Host "复制插件路径到剪贴板"
        Write-Host "  [0] " -ForegroundColor Yellow -NoNewline; Write-Host "返回上级"
        Write-Host "  [Q] " -ForegroundColor Yellow -NoNewline; Write-Host "退出"
        Write-Host ""

        $ch = Read-Choice "  请选择: " @('1','2','0','Q')
        switch ($ch) {
            '1' {
                if ($Browser.ExePath -and (Test-Path $Browser.ExePath)) {
                    Start-Process $Browser.ExePath -ArgumentList "chrome://extensions"
                    Write-Host ""
                    Write-Host "  已尝试打开扩展页面" -ForegroundColor Green
                    Write-Host "  如果浏览器未自动跳转，请在地址栏手动输入: chrome://extensions" -ForegroundColor Yellow
                } else {
                    Write-Host ""
                    Write-Host "  未找到浏览器 exe，请手动打开浏览器" -ForegroundColor Yellow
                    Write-Host "  在地址栏输入: chrome://extensions" -ForegroundColor Yellow
                }
                Wait-AnyKey
            }
            '2' {
                Set-Clipboard $extDir
                Write-Host "`n  已复制: $extDir" -ForegroundColor Green
                Wait-AnyKey
            }
            '0' { return }
            'Q' { exit 0 }
        }
    }
}

# ============================================================
# 查看安装方法（通用，不针对特定浏览器）
# ============================================================
function Show-InstallGuide {
    Clear-Host
    Write-Host ""
    Write-Host "  ────── 安装方法 ──────" -ForegroundColor Cyan
    Write-Host ""
    Show-InstallSteps
    Write-Host ""
    Wait-AnyKey "  按任意键返回..."
}

# ============================================================
# 启动
# ============================================================
Show-MainMenu
