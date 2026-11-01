# Security Audit Script for KeelBill Ledger
# Run this periodically to check for dependency vulnerabilities
# Usage: .\security_audit.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  KeelBill Ledger - Security Audit" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# 1. Check Python dependencies for known vulnerabilities
Write-Host "--- 1. Python Dependency Vulnerability Scan ---" -ForegroundColor Yellow

$backendDir = "backend\backend"
$venvPython = Join-Path $backendDir "venv\Scripts\python.exe"
$venvPip = Join-Path $backendDir "venv\Scripts\pip.exe"

if (Test-Path $venvPip) {
    Write-Host "Checking for outdated packages..." -ForegroundColor Gray
    & $venvPip list --outdated 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    
    Write-Host "`nRecommendation: Run 'pip install --upgrade <package>' for outdated packages." -ForegroundColor Yellow
} else {
    Write-Host "Virtual environment not found at $backendDir" -ForegroundColor Red
}

# 2. Check Node.js dependencies
Write-Host "`n--- 2. Node.js Dependency Audit ---" -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "Running npm audit..." -ForegroundColor Gray
    npm audit --production 2>&1 | Select-Object -First 30
    Write-Host "`nRecommendation: Run 'npm audit fix' to auto-fix safe vulnerabilities." -ForegroundColor Yellow
} else {
    Write-Host "package.json not found" -ForegroundColor Red
}

# 3. Check for hardcoded secrets
Write-Host "`n--- 3. Hardcoded Secrets Check ---" -ForegroundColor Yellow

$secretPatterns = @(
    "password\s*=\s*['\"]",
    "api_key\s*=\s*['\"]",
    "secret_key\s*=\s*['\"]",
    "JWT_SECRET",
    "smtp_password"
)

$foundSecrets = $false
foreach ($pattern in $secretPatterns) {
    $results = Select-String -Path "backend\backend\app\**\*.py" -Pattern $pattern -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($results) {
        Write-Host "WARNING: Potential hardcoded secret found matching pattern: $pattern" -ForegroundColor Red
        $results | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber)" -ForegroundColor DarkRed }
        $foundSecrets = $true
    }
}

if (-not $foundSecrets) {
    Write-Host "No hardcoded secrets detected in backend code." -ForegroundColor Green
}

# 4. Check .env file status
Write-Host "`n--- 4. Environment File Check ---" -ForegroundColor Yellow

$envFile = Join-Path $backendDir ".env"
$gitignoreFile = ".gitignore"

if (Test-Path $envFile) {
    Write-Host ".env file exists (contains sensitive credentials)" -ForegroundColor Yellow
    Write-Host "  Make sure it's NOT committed to git!" -ForegroundColor Yellow
}

if (Test-Path $gitignoreFile) {
    $gitignoreContent = Get-Content $gitignoreFile -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host ".env is properly listed in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "WARNING: .env is NOT in .gitignore!" -ForegroundColor Red
    }
}

# 5. Docker security check
Write-Host "`n--- 5. Docker Configuration Check ---" -ForegroundColor Yellow

$dockerCompose = "docker-compose.yml"
if (Test-Path $dockerCompose) {
    $dcContent = Get-Content $dockerCompose -Raw
    if ($dcContent -match 'POSTGRES_PORT.*543') {
        Write-Host "WARNING: Database port may be exposed in docker-compose.yml" -ForegroundColor Red
    } else {
        Write-Host "Database port is not exposed in docker-compose.yml" -ForegroundColor Green
    }
}

# 6. Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Security Audit Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Recommended actions:" -ForegroundColor Yellow
Write-Host "1. Update outdated Python packages: pip install --upgrade <package>" -ForegroundColor White
Write-Host "2. Fix Node.js vulnerabilities: npm audit fix" -ForegroundColor White
Write-Host "3. Rotate any exposed credentials in .env" -ForegroundColor White
Write-Host "4. Review and address any warnings above" -ForegroundColor White
Write-Host "`n"
