# GreenFleet — Start Backend
# Prerequisites: Python 3.11+, PostgreSQL running on port 5432

Set-Location "$PSScriptRoot\backend"

# Create venv if not exists
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "Virtual environment created."
}

# Activate and install
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet

# Copy .env if not present
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from example. Edit DATABASE_URL and SECRET_KEY before first run."
}

# Run
Write-Host "Starting GreenFleet API on http://localhost:8000"
Write-Host "API docs: http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
