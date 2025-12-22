# Fix sub-criteria loading issue
$filePath = "frontend\src\app\evaluations\[id]\page.tsx"
$content = Get-Content $filePath -Raw

# Replace the problematic section
$oldText = @'
            // Only load from database if state is empty (not already entered by user)
            if (Object.keys(classMonitorSubCriteriaScores).length === 0 && 
                Object.keys(advisorSubCriteriaScores).length === 0 && 
                evalData.details) {
              evalData.details.forEach(detail => {
                // Find the criterion
                const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId) as any;
                if (criterion && criterion.subCriteria) {
'@

$newText = @'
            // Always load scores from database when evaluation data is available
            if (evalData.details) {
              evalData.details.forEach(detail => {
                // Find the criterion
                const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId);
                if (criterion) {
                  // Parse sub-criteria from description
                  const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
                  if (subCriteria && subCriteria.length > 0) {
'@

$content = $content.Replace($oldText, $newText)

# Replace criterion.subCriteria with subCriteria in the fallback section
$content = $content.Replace('criterion.subCriteria.reduce', 'subCriteria.reduce')
$content = $content.Replace('criterion.subCriteria.forEach', 'subCriteria.forEach')

# Add closing brace for the new if block
$content = $content.Replace(
  '                  }
                }
              });',
  '                  }
                }
              }
              });'
)

Set-Content $filePath $content -NoNewline
Write-Host "Fixed sub-criteria loading in $filePath"
