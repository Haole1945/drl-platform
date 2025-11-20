/**
 * Parser for Criteria Description to extract Sub-Criteria
 * Parses description like:
 * "Bao gồm:\n1.1. Ý thức và thái độ trong học tập: 3 điểm (Đi học đầy đủ...)\n1.2. Kết quả học tập: 10 điểm..."
 */

export interface SubCriteria {
  id: string; // e.g., "1.1", "1.2"
  name: string;
  description: string;
  maxPoints: number;
}

/**
 * Parse criteria description to extract sub-criteria
 */
export function parseSubCriteria(
  criteriaIndex: number,
  description: string
): SubCriteria[] {
  if (!description) return [];

  const subCriteria: SubCriteria[] = [];
  
  // Split by newlines
  const lines = description.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Skip "Bao gồm:" line
    if (line.trim() === 'Bao gồm:' || line.trim().startsWith('Bao gồm:')) {
      continue;
    }

    // Match pattern: "1.1. Name: X điểm (description)"
    // or "1.1. Name: X điểm cơ bản (description)"
    // Handle both positive and negative points
    const match = line.match(/^(\d+\.\d+)\.\s*(.+?):\s*([-\d.]+)\s*điểm(?:\s*cơ\s*bản)?(?:\s*\((.+?)\))?/);
    
    if (match) {
      const [, subId, name, pointsStr, desc] = match;
      const maxPoints = parseFloat(pointsStr);
      
      if (!isNaN(maxPoints)) {
        // For negative points (like -1đ for retake), use absolute value as max
        // But we'll allow negative scores in the input
        subCriteria.push({
          id: subId,
          name: name.trim(),
          description: desc ? desc.trim() : '',
          maxPoints: Math.abs(maxPoints), // Use absolute value for max display
        });
      }
    } else {
      // Try alternative pattern without parentheses
      const altMatch = line.match(/^(\d+\.\d+)\.\s*(.+?):\s*([-\d.]+)\s*điểm/);
      if (altMatch) {
        const [, subId, name, pointsStr] = altMatch;
        const maxPoints = parseFloat(pointsStr);
        if (!isNaN(maxPoints)) {
          subCriteria.push({
            id: subId,
            name: name.trim(),
            description: '',
            maxPoints: Math.abs(maxPoints),
          });
        }
      }
    }
  }

  return subCriteria;
}

/**
 * Calculate total score from sub-criteria scores
 */
export function calculateCriteriaTotal(
  subCriteria: SubCriteria[],
  scores: Record<string, number>
): number {
  return subCriteria.reduce((total, sub) => {
    const score = scores[sub.id] || 0;
    return total + score;
  }, 0);
}

