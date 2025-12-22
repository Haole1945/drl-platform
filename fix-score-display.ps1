# PowerShell script to fix score display bug
$filePath = "frontend\src\app\evaluations\[id]\page.tsx"
$content = Get-Content -LiteralPath $filePath

# Find and replace the display logic for class monitor score
# Change from showing distributed score to showing "-"
$newContent = $content -replace `
  '(\s+<span className="font-semibold text-yellow-700 dark:text-yellow-400">)\s*\{displayedClassMonitorScore \?\? 0\}', `
  '$1{criterion.classMonitorScore != null ? criterion.classMonitorScore : "-"}'

# Change advisor score display similarly
$newContent = $newContent -replace `
  '(\s+<span className="font-semibold text-green-700 dark:text-green-400">)\s*\{displayedAdvisorScore \?\? 0\}', `
  '$1{criterion.advisorScore != null ? criterion.advisorScore : "-"}'

# Save the modified content
$newContent | Set-Content -LiteralPath $filePath -Encoding UTF8

Write-Host "Score display fix applied successfully!" -ForegroundColor Green
Write-Host "Please test the changes by viewing an evaluation with class monitor scores." -ForegroundColor Yellow
