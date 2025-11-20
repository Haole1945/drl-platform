# Test script for Eureka Service Discovery

$baseUrl = "http://localhost:8080/api"
$eurekaUrl = "http://localhost:8761"
$logFile = "eureka-discovery-test.log"

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
        [hashtable]$body = $null
    )
    
    try {
        $uri = "$baseUrl$endpoint"
        $params = @{
            Uri = $uri
            Method = $method
            ContentType = "application/json"
            ErrorAction = "Stop"
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
            $errorMsg = "$errorMsg | Response: $responseBody"
        }
        return @{ success = $false; error = $errorMsg }
    }
}

Write-Log "=== Eureka Service Discovery Test ===" "Cyan"
Write-Log "Testing service discovery and routing through Gateway" "Cyan"

# Test 1: Check Eureka Dashboard
Write-Log "`n1. Checking Eureka Server Dashboard..." "Yellow"
try {
    $response = Invoke-WebRequest -Uri "$eurekaUrl" -Method GET -ErrorAction Stop
    Write-Log "OK: Eureka Server is running on port 8761" "Green"
    Write-Log "  Dashboard URL: $eurekaUrl" "Gray"
} catch {
    Write-Log "ERROR: Eureka Server not accessible - $($_.Exception.Message)" "Red"
    Write-Log "  Make sure eureka-server is running" "Yellow"
}

# Test 2: Test Gateway -> Student Service
Write-Log "`n2. Testing Gateway -> Student Service (via Eureka)..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/students/hello"
if ($result.success) {
    Write-Log "OK: Gateway routed to student-service successfully" "Green"
    Write-Log "  Response: $($result.data)" "Gray"
} else {
    Write-Log "ERROR: Failed to route to student-service - $($result.error)" "Red"
}

# Test 3: Test Gateway -> Auth Service
Write-Log "`n3. Testing Gateway -> Auth Service (via Eureka)..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/auth/hello"
if ($result.success) {
    Write-Log "OK: Gateway routed to auth-service successfully" "Green"
} else {
    # Auth service might not have /hello endpoint, try /auth/register with invalid data
    Write-Log "  /auth/hello not found, trying /auth/register (expected to fail validation)..." "Gray"
    $registerBody = @{
        username = ""
        email = ""
        password = ""
    }
    $result = ApiCall -method "POST" -endpoint "/auth/register" -body $registerBody
    if ($result.success -or ($result.error -like "*validation*" -or $result.error -like "*400*")) {
        Write-Log "OK: Gateway routed to auth-service (validation error expected)" "Green"
    } else {
        Write-Log "WARNING: Could not verify auth-service routing" "Yellow"
    }
}

# Test 4: Test Gateway -> Evaluation Service (protected - requires JWT)
Write-Log "`n4. Testing Gateway -> Evaluation Service (via Eureka)..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/rubrics"
if ($result.success) {
    Write-Log "OK: Gateway routed to evaluation-service successfully" "Green"
    $rubrics = $result.data.data
    Write-Log "  Found $($rubrics.Count) rubrics" "Gray"
} else {
    if ($result.error -like "*401*" -or $result.error -like "*Unauthorized*") {
        Write-Log "OK: Gateway routed to evaluation-service (401 expected - endpoint requires JWT token)" "Green"
} else {
    Write-Log "ERROR: Failed to route to evaluation-service - $($result.error)" "Red"
    }
}

# Test 5: Test Student Service endpoints (protected - requires JWT)
Write-Log "`n5. Testing Student Service endpoints..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/students?page=0&size=5"
if ($result.success) {
    $students = $result.data.data.content
    Write-Log "OK: Retrieved $($students.Count) students via Gateway" "Green"
} else {
    if ($result.error -like "*401*" -or $result.error -like "*Unauthorized*") {
        Write-Log "OK: Gateway routed to student-service (401 expected - endpoint requires JWT token)" "Green"
} else {
    Write-Log "ERROR: Failed to get students - $($result.error)" "Red"
    }
}

# Test 6: Test TrainingPoint endpoints (protected - requires JWT)
Write-Log "`n6. Testing TrainingPoint endpoints..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/training-points?page=0&size=5"
if ($result.success) {
    $tps = $result.data.data.content
    Write-Log "OK: Retrieved $($tps.Count) training points via Gateway" "Green"
} else {
    if ($result.error -like "*401*" -or $result.error -like "*Unauthorized*") {
        Write-Log "OK: Gateway routed to student-service (401 expected - endpoint requires JWT token)" "Green"
} else {
    Write-Log "ERROR: Failed to get training points - $($result.error)" "Red"
    }
}

# Test 7: Test Criteria endpoints (protected - requires JWT)
Write-Log "`n7. Testing Criteria endpoints..." "Yellow"
# First get a rubric ID
$rubricResult = ApiCall -method "GET" -endpoint "/rubrics"
if ($rubricResult.success -and $rubricResult.data.data.Count -gt 0) {
    $rubricId = $rubricResult.data.data[0].id
    $result = ApiCall -method "GET" -endpoint "/criteria?rubricId=$rubricId"
    if ($result.success) {
        $criteria = $result.data.data
        Write-Log "OK: Retrieved $($criteria.Count) criteria via Gateway (rubricId=$rubricId)" "Green"
    } else {
        if ($result.error -like "*401*" -or $result.error -like "*Unauthorized*") {
            Write-Log "OK: Gateway routed to evaluation-service (401 expected - endpoint requires JWT token)" "Green"
    } else {
        Write-Log "ERROR: Failed to get criteria - $($result.error)" "Red"
        }
    }
} else {
    if ($rubricResult.error -like "*401*" -or $rubricResult.error -like "*Unauthorized*") {
        Write-Log "OK: Gateway routed to evaluation-service (401 expected - endpoint requires JWT token)" "Green"
        Write-Log "  Note: To test with data, use JWT token from login" "Gray"
    } else {
        Write-Log "WARNING: Could not get rubrics - $($rubricResult.error)" "Yellow"
    }
}

# Summary
Write-Log "`n=== Test Summary ===" "Cyan"
Write-Log "1. Eureka Server: Check dashboard at $eurekaUrl" "White"
Write-Log "2. Gateway routing: All services should be accessible via Gateway" "White"
Write-Log "3. Service Discovery: Services should appear in Eureka dashboard" "White"
Write-Log "4. Authentication: Protected endpoints return 401 (expected) - use JWT token for full access" "White"
Write-Log "`nNote: 401 Unauthorized errors are EXPECTED for protected endpoints without JWT tokens." "Yellow"
Write-Log "      This confirms that Gateway routing and JWT authentication are working correctly." "Yellow"
Write-Log "`nLog saved to: $logFile" "Gray"

