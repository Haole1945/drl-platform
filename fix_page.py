#!/usr/bin/env python3
import re

# Read the file
with open('frontend/src/app/evaluations/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Change the condition to always load
content = content.replace(
    '// Only load from database if state is empty (not already entered by user)\n            if (Object.keys(classMonitorSubCriteriaScores).length === 0 && \n                Object.keys(advisorSubCriteriaScores).length === 0 && \n                evalData.details) {',
    '// Always load scores from database when evaluation data is available\n            if (evalData.details) {'
)

# Fix 2: Parse subCriteria before checking
content = content.replace(
    'const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId);\n                if (criterion && criterion.subCriteria) {',
    'const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId);\n                if (criterion) {\n                  // Parse sub-criteria from description\n                  const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || \'\');\n                  if (subCriteria && subCriteria.length > 0) {'
)

# Fix 3: Replace criterion.subCriteria with subCriteria
content = content.replace('criterion.subCriteria.reduce', 'subCriteria.reduce')
content = content.replace('criterion.subCriteria.forEach', 'subCriteria.forEach')

# Fix 4: Add closing brace for if (subCriteria...)
# Find the position after the last } of the else block and before });
pattern = r'(                      \}\);\n                    \}\n                  \}\n                \}\n              \}\);)'
replacement = r'                      });\n                    }\n                  }\n                }\n              }\n              });'
content = re.sub(pattern, replacement, content)

# Write back
with open('frontend/src/app/evaluations/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed page.tsx successfully!")
