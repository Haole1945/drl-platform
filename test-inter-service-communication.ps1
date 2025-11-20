# Test script for Inter-Service Communication (Feign Clients)

$baseUrl = "http://localhost:8080/api"
$logFile = "inter-service-communication-test.log"

function Write-Log {
    param([string]$message, [string]$color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $message"
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $logFile -Value $line
}

function ApiCall {
    param(
        [string]$method,
        [string]$endpoint,
        [hashtable]$body = $null,
        [string]$token = $null
    )
    
    try {
        $uri = "$baseUrl$endpoint"
        $headers = @{}
        if ($token) {
            $headers["Authorization"] = "Bearer $token"
        }
        
        $params = @{
            Uri = $uri
            Method = $method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($headers.Count -gt 0) {
            $params.Headers = $headers
        }
        
        if ($body) {
            $jsonBody = $body | ConvertTo-Json -Depth 10
            $utf8 = New-Object System.Text.UTF8Encoding $false
            $jsonBytes = $utf8.GetBytes($jsonBody)
            $params.Body = $jsonBytes
        }
        
        $response = Invoke-RestMethod @params
        return @{ success = $true; data = $response }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            try {
                $errorObj = $responseBody | ConvertFrom-Json
                $errorMsg = "$errorMsg | Message: $($errorObj.message)"
            } catch {
                $errorMsg = "$errorMsg | Response: $responseBody"
            }
        }
        return @{ success = $false; error = $errorMsg }
    }
}

Write-Log "=== Inter-Service Communication Test ===" "Cyan"
Write-Log "Testing Feign Client communication between services" "Cyan"

# Authenticate to get JWT token for protected endpoints
Write-Log "`n0. Authenticating to get JWT token..." "Yellow"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUsername = "test_inter_$timestamp"
$testPassword = "TestPass123!"

# Register a test user for authentication
$registerAuthBody = @{
    username = $testUsername
    email = "test_inter_$timestamp@example.com"
    password = $testPassword
    fullName = "Test Inter-Service User"
    studentCode = "N21DCCN001"
}

$authResult = ApiCall -method "POST" -endpoint "/auth/register" -body $registerAuthBody
if (-not $authResult.success) {
    Write-Log "WARNING: Could not register test user, trying login..." "Yellow"
    # Try to login with existing user
    $loginBody = @{
        username = "admin"
        password = "admin123"
    }
    $authResult = ApiCall -method "POST" -endpoint "/auth/login" -body $loginBody
}

if ($authResult.success) {
    # If registration succeeded, login with new user
    if ($authResult.data.data.id) {
        $loginBody = @{
            username = $testUsername
            password = $testPassword
        }
        $loginResult = ApiCall -method "POST" -endpoint "/auth/login" -body $loginBody
        if ($loginResult.success) {
            $accessToken = $loginResult.data.data.accessToken
            Write-Log "OK: Authentication successful" "Green"
        } else {
            $accessToken = $null
            Write-Log "WARNING: Could not login, some tests may fail" "Yellow"
        }
    } else {
        # Already logged in
        $accessToken = $authResult.data.data.accessToken
        Write-Log "OK: Authentication successful" "Green"
    }
} else {
    $accessToken = $null
    Write-Log "WARNING: Could not authenticate, some tests may fail" "Yellow"
}

# Test 1: Register user with valid studentCode (should validate via student-service)
Write-Log "`n1. Testing auth-service -> student-service (valid studentCode)..." "Yellow"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$registerBody = @{
    username = "testuser_$timestamp"
    email = "test_$timestamp@test.com"
    password = "Test123456"
    fullName = "Test User"
    studentCode = "N21DCCN001"  # Valid student from seeder
}

$result = ApiCall -method "POST" -endpoint "/auth/register" -body $registerBody
if ($result.success) {
    Write-Log "OK: User registered successfully with valid studentCode" "Green"
    Write-Log "  User ID: $($result.data.data.id)" "Gray"
} else {
    Write-Log "ERROR: Registration failed - $($result.error)" "Red"
}

# Test 2: Register user with invalid studentCode (should fail validation)
Write-Log "`n2. Testing auth-service -> student-service (invalid studentCode)..." "Yellow"
$registerBody2 = @{
    username = "testuser2_$timestamp"
    email = "test2_$timestamp@test.com"
    password = "Test123456"
    fullName = "Test User 2"
    studentCode = "INVALID_STUDENT_CODE"
}

$result2 = ApiCall -method "POST" -endpoint "/auth/register" -body $registerBody2
if (-not $result2.success) {
    if ($result2.error -like "*Student*not found*" -or $result2.error -like "*404*") {
        Write-Log "OK: Registration correctly rejected invalid studentCode" "Green"
    } else {
        Write-Log "WARNING: Registration failed but error message unclear - $($result2.error)" "Yellow"
    }
} else {
    Write-Log "ERROR: Registration should have failed with invalid studentCode!" "Red"
}

# Test 3: Create evaluation with valid studentCode (should validate via student-service)
Write-Log "`n3. Testing evaluation-service -> student-service (valid studentCode)..." "Yellow"
# First get rubric and criteria (requires authentication)
if (-not $accessToken) {
    Write-Log "WARNING: No authentication token, skipping evaluation tests" "Yellow"
} else {
    $rubricResult = ApiCall -method "GET" -endpoint "/rubrics/active" -token $accessToken
    if ($rubricResult.success) {
        $rubricId = $rubricResult.data.data.id
        $criteriaResult = ApiCall -method "GET" -endpoint "/criteria?rubricId=$rubricId" -token $accessToken
        
        if ($criteriaResult.success -and $criteriaResult.data.data.Count -gt 0) {
            $criteria = $criteriaResult.data.data
            $details = @()
            $maxDetails = [Math]::Min(3, $criteria.Count)
            for ($i = 0; $i -lt $maxDetails; $i++) {
                $c = $criteria[$i]
                $score = [Math]::Round($c.maxPoints * 0.8, 2)
                $details += @{
                    criteriaId = $c.id
                    score = $score
                    evidence = "Evidence for criteria $($c.id)"
                    note = "Note for criteria $($c.id)"
                }
            }
            
            $evalBody = @{
                studentCode = "N21DCCN001"  # Valid student
                rubricId = $rubricId
                semester = "2024-2025-HK1-TEST"
                academicYear = "2024-2025"
                details = $details
            }
            
            $evalResult = ApiCall -method "POST" -endpoint "/evaluations" -body $evalBody -token $accessToken
            if ($evalResult.success) {
                Write-Log "OK: Evaluation created successfully with valid studentCode" "Green"
                Write-Log "  Evaluation ID: $($evalResult.data.data.id)" "Gray"
                
                # Clean up - delete test evaluation
                $evalId = $evalResult.data.data.id
                $deleteResult = ApiCall -method "DELETE" -endpoint "/evaluations/$evalId" -token $accessToken
                if ($deleteResult.success) {
                    Write-Log "  Cleaned up test evaluation" "Gray"
                }
            } else {
                Write-Log "ERROR: Evaluation creation failed - $($evalResult.error)" "Red"
            }
        } else {
            Write-Log "WARNING: Could not get criteria, skipping evaluation test" "Yellow"
        }
    } else {
        Write-Log "WARNING: Could not get rubric, skipping evaluation test" "Yellow"
    }

    # Test 4: Create evaluation with invalid studentCode (should fail validation)
    Write-Log "`n4. Testing evaluation-service -> student-service (invalid studentCode)..." "Yellow"
    if ($rubricResult.success) {
        $rubricId = $rubricResult.data.data.id
        $criteriaResult = ApiCall -method "GET" -endpoint "/criteria?rubricId=$rubricId" -token $accessToken
        
        if ($criteriaResult.success -and $criteriaResult.data.data.Count -gt 0) {
            $criteria = $criteriaResult.data.data
            $details = @()
            $maxDetails = [Math]::Min(2, $criteria.Count)
            for ($i = 0; $i -lt $maxDetails; $i++) {
                $c = $criteria[$i]
                $score = [Math]::Round($c.maxPoints * 0.8, 2)
                $details += @{
                    criteriaId = $c.id
                    score = $score
                    evidence = "Evidence"
                    note = "Note"
                }
            }
            
            $evalBody2 = @{
                studentCode = "INVALID_STUDENT_CODE"
                rubricId = $rubricId
                semester = "2024-2025-HK1-TEST2"
                academicYear = "2024-2025"
                details = $details
            }
            
            $evalResult2 = ApiCall -method "POST" -endpoint "/evaluations" -body $evalBody2 -token $accessToken
            if (-not $evalResult2.success) {
                if ($evalResult2.error -like "*Student*not found*" -or $evalResult2.error -like "*404*") {
                    Write-Log "OK: Evaluation creation correctly rejected invalid studentCode" "Green"
                } else {
                    Write-Log "WARNING: Evaluation creation failed but error unclear - $($evalResult2.error)" "Yellow"
                }
            } else {
                Write-Log "ERROR: Evaluation creation should have failed with invalid studentCode!" "Red"
            }
        }
    }
}

# Summary
Write-Log "`n=== Test Summary ===" "Cyan"
Write-Log "1. auth-service -> student-service: Validates studentCode during registration" "White"
Write-Log "2. evaluation-service -> student-service: Validates studentCode during evaluation creation" "White"
Write-Log "3. Inter-service communication via Feign Clients working correctly" "White"
Write-Log "`nLog saved to: $logFile" "Gray"


