# PowerShell script to fix the score display bug
$filePath = "frontend\src\app\evaluations\[id]\page.tsx"

Write-Host "Reading file..." -ForegroundColor Cyan
$content = Get-Content -LiteralPath $filePath -Raw

Write-Host "Applying fixes..." -ForegroundColor Cyan

# Fix 1: Add TableFooter to imports
$content = $content -replace `
  'import \{ Table, TableBody, TableCell, TableHead, TableHeader, TableRow \} from ''@/components/ui/table'';', `
  'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from ''@/components/ui/table'';'

# Fix 2: Change the displayedClassMonitorScore logic to not show distributed scores
$content = $content -replace `
  '(?s)(const displayedClassMonitorScore = editableClassMonitorScore !== undefined && editableClassMonitorScore !== null\s*\?\s*editableClassMonitorScore\s*:\s*\(classMonitorSubScore[^;]+;)', `
  'const displayedClassMonitorScore = editableClassMonitorScore;'

$content = $content -replace `
  '(?s)(const displayedAdvisorScore = editableAdvisorScore !== undefined && editableAdvisorScore !== null\s*\?\s*editableAdvisorScore\s*:\s*\(advisorSubScore[^;]+;)', `
  'const displayedAdvisorScore = editableAdvisorScore;'

# Fix 3: Change the display in table cells to show dash when not editing
$content = $content -replace `
  '(<span className="font-semibold text-yellow-700 dark:text-yellow-400">\s*)\{displayedClassMonitorScore \?\? 0\}', `
  '$1{displayedClassMonitorScore != null ? displayedClassMonitorScore : ''-''}'

$content = $content -replace `
  '(<span className="font-semibold text-green-700 dark:text-green-400">\s*)\{displayedAdvisorScore \?\? 0\}', `
  '$1{displayedAdvisorScore != null ? displayedAdvisorScore : ''-''}'

# Fix 4: Add TableFooter with summary row
$summaryRow = @'
                        </TableBody>
                        <TableFooter>
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell colSpan={2} className="text-right">
                              Tổng điểm tiêu chí:
                            </TableCell>
                            <TableCell className="text-center">{criterion.maxPoints}</TableCell>
                            <TableCell className="text-center text-primary">
                              {Math.round(criterion.totalScore)}
                            </TableCell>
                            <TableCell className="text-center text-yellow-700 dark:text-yellow-400">
                              {criterion.classMonitorScore != null ? criterion.classMonitorScore : '-'}
                            </TableCell>
                            <TableCell className="text-center text-green-700 dark:text-green-400">
                              {criterion.advisorScore != null ? criterion.advisorScore : '-'}
                            </TableCell>
                            <TableCell colSpan={2}></TableCell>
                          </TableRow>
                        </TableFooter>
'@

$content = $content -replace `
  '(\s+</TableBody>)(\s+</Table>)', `
  $summaryRow + '$2'

Write-Host "Saving changes..." -ForegroundColor Cyan
$content | Set-Content -LiteralPath $filePath -Encoding UTF8 -NoNewline

Write-Host "Score display fix applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "1. Added TableFooter to imports"
Write-Host "2. Simplified displayedClassMonitorScore/displayedAdvisorScore logic"
Write-Host "3. Changed table cells to show dash instead of distributed scores"
Write-Host "4. Added summary row showing criterion-level scores"
Write-Host ""
Write-Host "Please test by viewing an evaluation with class monitor scores." -ForegroundColor Cyan
