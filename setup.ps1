# AI Interview Coach - double-click-friendly setup + launch for Windows.
# Invoked by setup.bat (which bypasses PowerShell's script-execution policy
# just for this process, so double-clicking setup.bat doesn't hit the
# "scripts are disabled on this system" error). See README.md "Quick start".

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Pause-And-Exit($code) {
    Write-Host ""
    Read-Host "Press Enter to close this window"
    exit $code
}

Write-Host "=== AI Interview Coach setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js is installed.
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js was not found on this computer." -ForegroundColor Red
    Write-Host "This app needs Node.js 20.9 or newer to run."
    Write-Host "Download and install it from https://nodejs.org (choose the LTS version), then run this script again."
    Pause-And-Exit 1
}

# 2. Check the Node.js version meets Next.js's minimum (20.9.0).
$versionOutput = (node -v).TrimStart('v')
$version = [Version]($versionOutput -replace '-.*$', '')
$minVersion = [Version]"20.9.0"
if ($version -lt $minVersion) {
    Write-Host "Found Node.js v$versionOutput, but this app needs v20.9.0 or newer." -ForegroundColor Red
    Write-Host "Update Node.js from https://nodejs.org (choose the LTS version), then run this script again."
    Pause-And-Exit 1
}
Write-Host "Node.js v$versionOutput found." -ForegroundColor Green

# 3. Install dependencies the first time (or after a fresh clone).
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies (this happens once, may take a minute)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed - see the errors above." -ForegroundColor Red
        Pause-And-Exit 1
    }
} else {
    Write-Host "Dependencies already installed." -ForegroundColor Green
}

# 4. Build a production bundle the first time (or after a fresh clone).
#    This is a real production build (npm run build), not `next dev` - no
#    dev-only error overlay, no React dev warnings, and a faster, optimized
#    load. If you've edited the source and want to pick up changes, delete
#    the `out` folder and re-run this script.
if (-not (Test-Path "out")) {
    Write-Host ""
    Write-Host "Building the app (this happens once, may take a minute)..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed - see the errors above." -ForegroundColor Red
        Pause-And-Exit 1
    }
} else {
    Write-Host "Already built." -ForegroundColor Green
}

# 5. Open the browser a couple seconds after the server starts (it starts
#    almost instantly, since the build already happened above), in the
#    background, so this window can keep showing server logs.
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host ""
Write-Host "Starting the app - this window must stay open while you use it." -ForegroundColor Cyan
Write-Host "Your browser will open automatically. Press Ctrl+C here to stop." -ForegroundColor Cyan
Write-Host ""

npx serve@latest out -l 3000
