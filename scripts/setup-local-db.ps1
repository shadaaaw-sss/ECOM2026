# Local PostgreSQL Setup Script for Makhmal E-commerce
# Run this script to set up a local PostgreSQL database for development

Write-Host "=== Makhmal E-commerce - Local Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$pgInstalled = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgInstalled) {
    Write-Host "ERROR: PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, make sure 'psql' is available in your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL found: $($pgInstalled.Source)" -ForegroundColor Green
Write-Host ""

# Database configuration
$dbName = "makhmal_db"
$dbUser = "postgres"
$dbPassword = Read-Host "Enter PostgreSQL password for user '$dbUser'" -AsSecureString
$dbHost = "localhost"
$dbPort = "5432"

# Convert secure string to plain text (for script usage)
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""
Write-Host "Creating database '$dbName'..." -ForegroundColor Cyan

# Create database
$env:PGPASSWORD = $dbPasswordPlain
$createDbResult = psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database '$dbName' created successfully" -ForegroundColor Green
} elseif ($createDbResult -match "already exists") {
    Write-Host "Database '$dbName' already exists" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Failed to create database" -ForegroundColor Red
    Write-Host $createDbResult
    exit 1
}

Write-Host ""
Write-Host "Running database schema..." -ForegroundColor Cyan

# Run the seed script to create tables and insert data
$seedScript = Join-Path $PSScriptRoot "..\backend\drizzle\seed.ts"
if (Test-Path $seedScript) {
    Write-Host "Running seed script..." -ForegroundColor Cyan
    Set-Location "..\backend"
    npx tsx drizzle/seed.ts
    Write-Host "Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "WARNING: Seed script not found at $seedScript" -ForegroundColor Yellow
    Write-Host "You'll need to run the seed script manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "To use the local database, update backend/.env with:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://$dbUser`:$dbPasswordPlain@$dbHost`:$dbPort/$dbName" -ForegroundColor White
Write-Host ""
Write-Host "Then restart the backend server" -ForegroundColor Cyan

# Clear password from environment
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue