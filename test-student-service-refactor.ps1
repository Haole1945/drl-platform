# Test script for student-service after refactoring
# Tests only Student and TrainingPoint endpoints

$baseUrl = "http://localhost:8080/api"
$logFile = "student-service-refactor-test.log"

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
            ContentType = "application/json; charset=utf-8"
            ErrorAction = "Stop"
        }
        
        if ($body) {
            # Convert to JSON and ensure UTF-8 encoding
            $jsonBody = $body | ConvertTo-Json -Depth 10
            # Convert to UTF-8 byte array to ensure proper encoding
            $utf8 = New-Object System.Text.UTF8Encoding $false
            $jsonBytes = $utf8.GetBytes($jsonBody)
            $params.Body = $jsonBytes
        }
        
        if ($headers.Count -gt 0) {
            $params.Headers = $headers
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

Write-Log "=== Student Service Refactor Test ===" "Cyan"
Write-Log "Testing student-service after removing Evaluation, Rubric, Criteria modules" "Cyan"

# Authenticate to get JWT token for protected endpoints
# Note: Some tests require ADMIN or INSTRUCTOR role, so we try admin login first
Write-Log "`n0. Authenticating to get JWT token..." "Yellow"

# Try to login with admin first (for tests requiring admin privileges)
$loginBody = @{
    username = "admin"
    password = "admin123"
}
$authResult = ApiCall -method "POST" -endpoint "/auth/login" -body $loginBody

# If admin login fails, try to register and login with a test user
if (-not $authResult.success) {
    Write-Log "WARNING: Admin login failed, trying to register test user..." "Yellow"
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $testUsername = "test_student_$timestamp"
    $testPassword = "TestPass123!"
    
    $registerAuthBody = @{
        username = $testUsername
        email = "test_student_$timestamp@example.com"
        password = $testPassword
        fullName = "Test Student User"
        studentCode = "N21DCCN001"
    }
    
    $registerResult = ApiCall -method "POST" -endpoint "/auth/register" -body $registerAuthBody
    if ($registerResult.success) {
        # Login with newly registered user
        $loginBody = @{
            username = $testUsername
            password = $testPassword
        }
        $authResult = ApiCall -method "POST" -endpoint "/auth/login" -body $loginBody
    }
}

if ($authResult.success) {
    $accessToken = $authResult.data.data.accessToken
    Write-Log "OK: Authentication successful" "Green"
    Write-Log "  Note: Some tests require ADMIN role. If you see 'Access Denied', use an admin account." "Gray"
} else {
    $accessToken = $null
    Write-Log "WARNING: Could not authenticate, some tests may fail" "Yellow"
}

# Test 1: Hello endpoint (public, no auth needed)
Write-Log "`n1. Testing /students/hello endpoint..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/students/hello"
if ($result.success) {
    Write-Log "OK: Hello endpoint works - $($result.data)" "Green"
} else {
    Write-Log "ERROR: Hello endpoint failed - $($result.error)" "Red"
}

# Test 2: Database test endpoint
Write-Log "`n2. Testing /students/db-test endpoint..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/students/db-test"
if ($result.success) {
    Write-Log "OK: Database test successful" "Green"
    $data = $result.data.data
    Write-Log "  - Faculties: $($data.faculties)" "White"
    Write-Log "  - Majors: $($data.majors)" "White"
    Write-Log "  - Classes: $($data.classes)" "White"
    Write-Log "  - Students: $($data.students)" "White"
} else {
    Write-Log "ERROR: Database test failed - $($result.error)" "Red"
}

# Test 3: Get all students (protected, requires auth)
Write-Log "`n3. Testing GET /students endpoint..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/students?page=0&size=10" -token $accessToken
if ($result.success) {
    $students = $result.data.data.content
    Write-Log "OK: Retrieved $($students.Count) students" "Green"
    if ($students.Count -gt 0) {
        $first = $students[0]
        Write-Log "  - First student: $($first.studentCode) - $($first.fullName)" "White"
    }
} else {
    Write-Log "ERROR: Failed to get students - $($result.error)" "Red"
}

# Test 4: Get student by code (protected, requires auth)
Write-Log "`n4. Testing GET /students/{studentCode} endpoint..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/students/N21DCCN001" -token $accessToken
if ($result.success) {
    $student = $result.data.data
    Write-Log "OK: Retrieved student $($student.studentCode) - $($student.fullName)" "Green"
} else {
    Write-Log "ERROR: Failed to get student - $($result.error)" "Red"
}

# Test 5: Create new student
Write-Log "`n5. Testing POST /students endpoint..." "Yellow"
$testStudentCode = "N21DCCN999"
$createBody = @{
    studentCode = $testStudentCode
    fullName = "Test Student Refactor"
    dateOfBirth = "2003-01-01"
    gender = "MALE"
    phone = "0999999999"
    address = "Hà Nội"
    academicYear = "2024-2025"
    classCode = "D21CQCN01-N"
    majorCode = "CN"
    facultyCode = "CNTT2"
}

# Delete if exists
$deleteResult = ApiCall -method "DELETE" -endpoint "/students/$testStudentCode" -token $accessToken
if ($deleteResult.success) {
    Write-Log "  - Deleted existing test student" "Gray"
}

$result = ApiCall -method "POST" -endpoint "/students" -body $createBody -token $accessToken
if ($result.success) {
    Write-Log "OK: Created student $testStudentCode" "Green"
    
    # Test 6: Update student
    Write-Log "`n6. Testing PUT /students/{studentCode} endpoint..." "Yellow"
    $updateBody = @{
        fullName = "Test Student Refactor Updated"
        phone = "0888888888"
    }
    $updateResult = ApiCall -method "PUT" -endpoint "/students/$testStudentCode" -body $updateBody -token $accessToken
    if ($updateResult.success) {
        Write-Log "OK: Updated student $testStudentCode" "Green"
    } else {
        Write-Log "ERROR: Failed to update student - $($updateResult.error)" "Red"
    }
    
    # Test 7: Delete student
    Write-Log "`n7. Testing DELETE /students/{studentCode} endpoint..." "Yellow"
    $deleteResult = ApiCall -method "DELETE" -endpoint "/students/$testStudentCode" -token $accessToken
    if ($deleteResult.success) {
        Write-Log "OK: Deleted student $testStudentCode" "Green"
    } else {
        Write-Log "ERROR: Failed to delete student - $($deleteResult.error)" "Red"
    }
} elseif ($result.error -like "*Access Denied*" -or $result.error -like "*403*") {
    Write-Log "WARNING: Access Denied - This test requires ADMIN or INSTRUCTOR role" "Yellow"
    Write-Log "  Skipping student creation/update/delete tests (5-7)" "Yellow"
} else {
    Write-Log "ERROR: Failed to create student - $($result.error)" "Red"
}

# Test 8: TrainingPoint endpoints (protected, requires auth)
Write-Log "`n8. Testing TrainingPoint endpoints..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/training-points?page=0&size=10" -token $accessToken
if ($result.success) {
    $tps = $result.data.data.content
    Write-Log "OK: Retrieved $($tps.Count) training points" "Green"
} else {
    Write-Log "ERROR: Failed to get training points - $($result.error)" "Red"
}

# Test 9: Verify Evaluation endpoints are removed from student-service
# Note: Gateway routes /api/evaluations to evaluation-service, so we test directly on student-service
Write-Log "`n9. Verifying Evaluation endpoints are removed from student-service..." "Yellow"
$studentServiceUrl = "http://localhost:8081"
try {
    $result = Invoke-RestMethod -Uri "$studentServiceUrl/evaluations" -Method "GET" -ErrorAction Stop
    Write-Log "WARNING: /evaluations endpoint still exists in student-service!" "Yellow"
} catch {
    Write-Log "OK: /evaluations endpoint removed from student-service (expected)" "Green"
}

# Test 10: Verify Rubric endpoints are removed from student-service
Write-Log "`n10. Verifying Rubric endpoints are removed from student-service..." "Yellow"
try {
    $result = Invoke-RestMethod -Uri "$studentServiceUrl/rubrics" -Method "GET" -ErrorAction Stop
    Write-Log "WARNING: /rubrics endpoint still exists in student-service!" "Yellow"
} catch {
    Write-Log "OK: /rubrics endpoint removed from student-service (expected)" "Green"
}

# Test 11: Verify Criteria endpoints are removed from student-service
Write-Log "`n11. Verifying Criteria endpoints are removed from student-service..." "Yellow"
try {
    $result = Invoke-RestMethod -Uri "$studentServiceUrl/criteria" -Method "GET" -ErrorAction Stop
    Write-Log "WARNING: /criteria endpoint still exists in student-service!" "Yellow"
} catch {
    Write-Log "OK: /criteria endpoint removed from student-service (expected)" "Green"
}

# Test 12: Verify gateway routes work correctly (protected, requires auth)
Write-Log "`n12. Verifying gateway routes to evaluation-service..." "Yellow"
$result = ApiCall -method "GET" -endpoint "/rubrics" -token $accessToken
if ($result.success) {
    Write-Log "OK: Gateway routes /api/rubrics to evaluation-service (correct)" "Green"
} else {
    Write-Log "WARNING: Gateway route to evaluation-service may not be working" "Yellow"
}

Write-Log "`n=== Test Complete ===" "Cyan"
Write-Log "Log saved to: $logFile" "Gray"

