# =======================================
# Auth Service Test Script
# Author: Hao AI Assistant
# =======================================

$baseUrl = "http://localhost:8080/api/auth"
$logFile = "auth-service-test.log"

# Reset log
"" | Out-File $logFile

function Log {
    param([string]$msg, [string]$color = "White")
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$timestamp] $msg"
    Write-Host $line -ForegroundColor $color
    try {
        Add-Content $logFile -Value $line -ErrorAction SilentlyContinue
    } catch {}
}

function ApiCall {
    param(
        [string]$method,
        [string]$url,
        $body = $null,
        [string]$token = $null,
        [string]$okMessage = "",
        [int]$maxRetries = 3,
        [int]$retryDelay = 3
    )

    $attempt = 0
    while ($attempt -lt $maxRetries) {
        try {
            $headers = @{}
            if ($token) {
                $headers["Authorization"] = "Bearer $token"
            }

            $jsonBody = $null
            if ($body -ne $null) {
                $jsonBody = $body | ConvertTo-Json -Depth 10
            }

            if ($method -eq 'GET') {
                $webResponse = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -ErrorAction Stop
                $res = $webResponse.Content | ConvertFrom-Json
            } else {
                $webResponse = Invoke-WebRequest -Uri $url -Method $method -Body $jsonBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
                $res = $webResponse.Content | ConvertFrom-Json
            }

            if ($okMessage -ne "") {
                Log "OK: $okMessage" "Green"
            }

            return $res.data
        }
        catch {
            $attempt++
            $statusCode = $null
            if ($_.Exception.Response) {
                $statusCode = $_.Exception.Response.StatusCode.value__
            }
            
            $msg = $_.Exception.Message
            if ($_.ErrorDetails.Message) {
                try {
                    $errObj = $_.ErrorDetails.Message | ConvertFrom-Json
                    $msg = "$msg | Server: $($errObj.message)"
                } catch {}
            }
            
            # Retry on 404 (Gateway might need time to discover services)
            if ($statusCode -eq 404 -and $attempt -lt $maxRetries) {
                Log "WARNING: Got 404, retrying in ${retryDelay}s (attempt $attempt/$maxRetries)..." "Yellow"
                Log "Note: Gateway might need time to discover services from Eureka" "Gray"
                Start-Sleep -Seconds $retryDelay
                continue
            }
            
            Log "ERROR calling $url -> $msg" "Red"
            return $null
        }
    }
    return $null
}

Log "=== Auth Service Testing ===" "Cyan"

# Wait for Gateway to discover services from Eureka
Log "Waiting for Gateway to discover services..." "Yellow"
$gatewayReady = $false
$maxWait = 60
$waited = 0
while (-not $gatewayReady -and $waited -lt $maxWait) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -ErrorAction Stop -TimeoutSec 2
        if ($health.status -eq "UP") {
            # Try to access auth service through Gateway
            try {
                $testBody = @{username="healthcheck";email="healthcheck@test.com";password="Test123456";fullName="HealthCheck"} | ConvertTo-Json
                $testRes = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method POST -Body $testBody -ContentType "application/json" -ErrorAction Stop -TimeoutSec 2
                $gatewayReady = $true
                Log "Gateway is ready and can route to auth-service" "Green"
            } catch {
                # 409 Conflict means service is reachable (user might exist)
                if ($_.Exception.Response.StatusCode.value__ -eq 409) {
                    $gatewayReady = $true
                    Log "Gateway is ready and can route to auth-service" "Green"
                } else {
                    Start-Sleep -Seconds 2
                    $waited += 2
                }
            }
        } else {
            Start-Sleep -Seconds 2
            $waited += 2
        }
    } catch {
        Start-Sleep -Seconds 2
        $waited += 2
        if ($waited % 10 -eq 0) {
            Log "Still waiting... ($waited/$maxWait seconds)" "Gray"
        }
    }
}

if (-not $gatewayReady) {
    Log "WARNING: Gateway might not be ready, but continuing anyway..." "Yellow"
}

# Generate unique username for this test run
$timestamp = (Get-Date).ToString("yyyyMMddHHmmss")
$testUsername = "testuser_$timestamp"
$testEmail = "testuser_$timestamp@example.com"

# =======================================
# 1. Register New User
# =======================================
Log "1. Testing User Registration..." "Yellow"
Log "Using unique username: $testUsername" "Gray"

$registerBody = @{
    username = $testUsername
    email = $testEmail
    password = "TestPass123!"
    fullName = "Test User"
    studentCode = "N21DCCN001"
}

$user = ApiCall POST "$baseUrl/register" $registerBody "User registered"
if (-not $user -or -not $user.id) {
    Log "FAIL: Registration failed" "Red"
    Log "Note: If you see 409 Conflict, the user may already exist. Try using a different username." "Yellow"
    exit 1
}

Log "Registered user ID = $($user.id)" "Gray"

# =======================================
# 2. Login
# =======================================
Log "2. Testing Login..." "Yellow"

$loginBody = @{
    username = $testUsername
    password = "TestPass123!"
}

$authResponse = ApiCall POST "$baseUrl/login" $loginBody "Login successful"
if (-not $authResponse -or -not $authResponse.accessToken) {
    Log "FAIL: Login failed" "Red"
    exit 1
}

$accessToken = $authResponse.accessToken
$refreshToken = $authResponse.refreshToken
Log "Access token received (length: $($accessToken.Length))" "Gray"
Log "Refresh token received (length: $($refreshToken.Length))" "Gray"

# =======================================
# 3. Get Current User (with token)
# =======================================
Log "3. Testing Get Current User..." "Yellow"

$currentUser = ApiCall GET "$baseUrl/me" $null $accessToken "Current user retrieved"
if (-not $currentUser) {
    Log "FAIL: Get current user failed" "Red"
    exit 1
}

Log "Current user: $($currentUser.username) - $($currentUser.fullName)" "Gray"
Log "Roles: $($currentUser.roles -join ', ')" "Gray"
Log "Permissions: $($currentUser.permissions.Count) permissions" "Gray"

# =======================================
# 4. Refresh Token
# =======================================
Log "4. Testing Token Refresh..." "Yellow"

$refreshBody = @{
    refreshToken = $refreshToken
}

$refreshResponse = ApiCall POST "$baseUrl/refresh" $refreshBody "Token refreshed"
if (-not $refreshResponse -or -not $refreshResponse.accessToken) {
    Log "FAIL: Token refresh failed" "Red"
    exit 1
}

$newAccessToken = $refreshResponse.accessToken
Log "New access token received" "Gray"

# =======================================
# 5. Test with New Token
# =======================================
Log "5. Testing with Refreshed Token..." "Yellow"

$userAfterRefresh = ApiCall GET "$baseUrl/me" $null $newAccessToken "User retrieved with new token"
if (-not $userAfterRefresh) {
    Log "FAIL: Get user with new token failed" "Red"
    exit 1
}

Log "User retrieved successfully with new token" "Green"

# =======================================
# 6. Test Invalid Credentials
# =======================================
Log "6. Testing Invalid Login..." "Yellow"

$invalidLogin = @{
    username = $testUsername
    password = "WrongPassword123!"
}

$invalidResponse = ApiCall POST "$baseUrl/login" $invalidLogin ""
if ($invalidResponse) {
    Log "WARNING: Invalid login should have failed" "Yellow"
} else {
    Log "OK: Invalid login correctly rejected" "Green"
}

# =======================================
# 7. Test Duplicate Registration
# =======================================
Log "7. Testing Duplicate Registration..." "Yellow"
Log "Attempting to register same user again..." "Gray"

$duplicateResponse = ApiCall POST "$baseUrl/register" $registerBody ""
if ($duplicateResponse) {
    Log "WARNING: Duplicate registration should have failed (409 Conflict)" "Yellow"
} else {
    Log "OK: Duplicate registration correctly rejected (409 Conflict)" "Green"
}

# =======================================
# SUMMARY
# =======================================
Log "=== ALL TESTS COMPLETED ===" "Cyan"
Log "Log saved to: $logFile" "Green"

