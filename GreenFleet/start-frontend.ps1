# GreenFleet — Start Frontend
# Prerequisites: Node.js 18+

Set-Location "$PSScriptRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

Write-Host "Starting GreenFleet frontend on http://localhost:5173"
npm run dev
