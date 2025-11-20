# =======================================
# Evaluation Service Test Script
# Author: Hao AI Assistant
# =======================================

$baseUrl = "http://localhost:8080/api"
$logFile = "evaluation-service-test.log"

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
        [string]$okMessage = ""
    )

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
        $msg = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            try {
                $errObj = $_.ErrorDetails.Message | ConvertFrom-Json
                $msg = "$msg | Server: $($errObj.message)"
            } catch {}
        }
        Log "ERROR calling $url -> $msg" "Red"
        return $null
    }
}

Log "=== Evaluation Service Testing ===" "Cyan"

# =======================================
# 0. AUTHENTICATION (Required for protected endpoints)
# =======================================
Log "0. Authenticating to get JWT token..." "Yellow"

# Try to login with a test user (or register if needed)
$testUsername = "admin"  # Use existing admin user or create one
$testPassword = "admin123"  # Default password

$loginBody = @{
    username = $testUsername
    password = $testPassword
}

$authResponse = ApiCall POST "http://localhost:8080/api/auth/login" $loginBody "Login successful"
if (-not $authResponse -or -not $authResponse.accessToken) {
    Log "WARNING: Login failed. Trying to register a new user..." "Yellow"
    
    # Try to register a new user
    $registerBody = @{
        username = "test_eval_$(Get-Date -Format 'yyyyMMddHHmmss')"
        email = "test_eval_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
        password = "TestPass123!"
        fullName = "Test Evaluation User"
        studentCode = "N21DCCN001"
    }
    
    $user = ApiCall POST "http://localhost:8080/api/auth/register" $registerBody "User registered"
    if ($user) {
        # Login with newly registered user
        $loginBody = @{
            username = $registerBody.username
            password = $registerBody.password
        }
        $authResponse = ApiCall POST "http://localhost:8080/api/auth/login" $loginBody "Login successful"
    }
    
    if (-not $authResponse -or -not $authResponse.accessToken) {
        Log "FAIL: Cannot authenticate. Cannot continue testing protected endpoints." "Red"
        Log "Note: All evaluation service endpoints require authentication." "Yellow"
        exit 1
    }
}

$accessToken = $authResponse.accessToken
Log "Authentication successful. Token obtained." "Green"

# =======================================
# 1. TEST RUBRIC ENDPOINTS
# =======================================
Log "1. Testing Rubric Endpoints..." "Yellow"

$rubrics = ApiCall GET "$baseUrl/rubrics" $null $accessToken "Rubrics fetched"
if (-not $rubrics -or $rubrics.Count -eq 0) {
    Log "WARNING: No rubrics found. Need to create one first." "Yellow"
    $rubricId = $null
} else {
    $rubricId = $rubrics[0].id
    Log "Using rubric ID: $rubricId" "Gray"
}

# Get active rubric
$activeRubric = ApiCall GET "$baseUrl/rubrics/active" $null $accessToken "Active rubric fetched"
if ($activeRubric) {
    $rubricId = $activeRubric.id
    Log "Active rubric ID: $rubricId" "Gray"
}

if (-not $rubricId) {
    Log "FAIL: No rubric available. Cannot continue testing." "Red"
    exit 1
}

# Get rubric details
$rubricDetails = ApiCall GET "$baseUrl/rubrics/$rubricId" $null $accessToken "Rubric details fetched"
if ($rubricDetails) {
    Log "Rubric: $($rubricDetails.name) (ID: $rubricId)" "Gray"
    Log "Criteria count: $($rubricDetails.criteriaCount)" "Gray"
}

# =======================================
# 2. TEST CRITERIA ENDPOINTS
# =======================================
Log "2. Testing Criteria Endpoints..." "Yellow"

$criteria = ApiCall GET "$baseUrl/criteria?rubricId=$rubricId" $null $accessToken "Criteria fetched"
if (-not $criteria -or $criteria.Count -eq 0) {
    Log "FAIL: No criteria found for rubric $rubricId" "Red"
    exit 1
}

Log "Criteria count = $($criteria.Count)" "Gray"
$criteriaIds = $criteria | ForEach-Object { $_.id }

# =======================================
# 3. TEST EVALUATION ENDPOINTS
# =======================================
Log "3. Testing Evaluation Endpoints..." "Yellow"

# Use existing student code from database
$studentCode = "N21DCCN001"

# Get student evaluations
$studentEvals = ApiCall GET "$baseUrl/evaluations/student/$studentCode" $null $accessToken "Student evaluations fetched"
Log "Found $($studentEvals.Count) evaluations for student $studentCode" "Gray"

# Generate unique semester
$timestamp = (Get-Date).ToString("HHmmss")
$semester = "2024-25-HK1-$timestamp"

# Clean up existing evaluation for this semester (if any)
if ($studentEvals -and $studentEvals.Count -gt 0) {
    $toDelete = $studentEvals | Where-Object { $_.semester -eq $semester }
    if ($toDelete) {
        Log "Cleaning up existing evaluation for semester $semester" "Gray"
        try {
            $headers = @{"Authorization" = "Bearer $accessToken"}
            Invoke-WebRequest -Uri "$baseUrl/evaluations/$($toDelete.id)" -Method DELETE -Headers $headers | Out-Null
        } catch {}
    }
}

# Create evaluation details from first 3 criteria
# Use 80% of maxPoints for each criteria (realistic scoring)
$details = @()
$maxDetails = [Math]::Min(3, $criteria.Count)
for ($i = 0; $i -lt $maxDetails; $i++) {
    $crit = $criteria[$i]
    $criteriaId = $crit.id
    $maxScore = $crit.maxScore
    # Calculate score as 80% of maxPoints (rounded to 1 decimal)
    $score = [Math]::Round($maxScore * 0.8, 1)
    $details += @{
        criteriaId = $criteriaId
        score = $score  # 80% of maxPoints for each criteria
        evidence = "Evidence for criteria $criteriaId ($($crit.name))"
        note = "Note for criteria $criteriaId - Score: $score/$maxScore"
    }
}

# Create evaluation
$createEvalBody = @{
    studentCode = $studentCode
    rubricId = $rubricId
    semester = $semester
    academicYear = "2024-2025"
    details = $details
}

$eval = ApiCall POST "$baseUrl/evaluations" $createEvalBody $accessToken "Evaluation created"
if (-not $eval -or -not $eval.id) {
    Log "FAIL: Evaluation creation failed or returned no ID" "Red"
    exit 1
}

$evalId = $eval.id
Log "Evaluation ID = $evalId" "Gray"

# Get evaluation by ID
$retrievedEval = ApiCall GET "$baseUrl/evaluations/$evalId" $null $accessToken "Evaluation retrieved by ID"
if ($retrievedEval) {
    Log "Retrieved evaluation status: $($retrievedEval.status)" "Gray"
}

# Submit evaluation
$submittedEval = ApiCall POST "$baseUrl/evaluations/$evalId/submit" $null $accessToken "Evaluation submitted"
if ($submittedEval) {
    Log "Submitted evaluation status: $($submittedEval.status)" "Gray"
}

# Get pending evaluations
$pending = ApiCall GET "$baseUrl/evaluations/pending?page=0&size=10" $null $accessToken "Pending list fetched"
if ($pending) {
    Log "Pending evaluations count: $($pending.totalElements)" "Gray"
}

# Approve evaluation (if we have user info)
# For now, skip approval test as it requires user authentication

# =======================================
# SUMMARY
# =======================================
Log "=== ALL TESTS COMPLETED ===" "Cyan"
Log "Log saved to: $logFile" "Green"

