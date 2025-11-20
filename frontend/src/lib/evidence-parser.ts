/**
 * Parser for Evidence text to extract Sub-Criteria, Scores, and File URLs
 * Evidence format: "SCORES:1.1=3,1.2=10|EVIDENCE:1.1. Name: /files/evidence/... 1.2. Name: /files/evidence/..."
 * Or legacy format: "1.1. Name: /files/evidence/... 1.2. Name: /files/evidence/..."
 */

export interface ParsedEvidence {
  subCriteriaId: string; // e.g., "1.1"
  name: string;
  fileUrls: string[];
  score?: number; // Score for this sub-criteria
}

/**
 * Parse scores from evidence string
 * Format: "SCORES:1.1=3,1.2=10"
 */
function parseScores(evidence: string): Record<string, number> {
  const scores: Record<string, number> = {};
  const scoresMatch = evidence.match(/SCORES:([^|]+)/);
  if (scoresMatch) {
    const scoresStr = scoresMatch[1];
    scoresStr.split(',').forEach(scorePair => {
      const [subId, score] = scorePair.split('=');
      if (subId && score) {
        scores[subId.trim()] = parseFloat(score.trim()) || 0;
      }
    });
  }
  return scores;
}

/**
 * Parse evidence text to extract sub-criteria, scores, and file URLs
 */
export function parseEvidence(evidence: string): ParsedEvidence[] {
  if (!evidence) return [];

  // Parse scores first
  const scores = parseScores(evidence);
  
  // Extract evidence part (after EVIDENCE: or legacy format)
  let evidencePart = evidence;
  const evidenceMatch = evidence.match(/EVIDENCE:(.+)/);
  if (evidenceMatch) {
    evidencePart = evidenceMatch[1];
  }
  
  const parsed: ParsedEvidence[] = [];
  
  // Split by sub-criteria pattern (e.g., "1.1.", "1.2.")
  // Pattern: "1.1. Name: /files/evidence/... /files/evidence/..."
  const subCriteriaPattern = /(\d+\.\d+)\.\s*([^:]+):\s*(.+?)(?=\d+\.\d+\.|$)/g;
  
  let match;
  while ((match = subCriteriaPattern.exec(evidencePart)) !== null) {
    const [, subId, name, filesText] = match;
    
    // Extract file URLs from the files text
    // URLs pattern: /files/evidence/...
    const urlPattern = /\/files\/evidence\/[^\s,]+/g;
    const fileUrls: string[] = [];
    let urlMatch;
    while ((urlMatch = urlPattern.exec(filesText)) !== null) {
      fileUrls.push(urlMatch[0]);
    }
    
    parsed.push({
      subCriteriaId: subId.trim(),
      name: name.trim(),
      fileUrls,
      score: scores[subId.trim()], // Get score from parsed scores
    });
  }
  
  // Merge scores into parsed entries (for sub-criteria that have evidence)
  parsed.forEach(entry => {
    if (entry.subCriteriaId && scores[entry.subCriteriaId] !== undefined) {
      entry.score = scores[entry.subCriteriaId];
    }
  });
  
  // Add entries for scores that don't have evidence pattern (sub-criteria with scores but no files)
  Object.entries(scores).forEach(([subId, score]) => {
    const existing = parsed.find(p => p.subCriteriaId === subId);
    if (!existing) {
      // This sub-criteria has a score but no evidence pattern, create entry for it
      parsed.push({
        subCriteriaId: subId,
        name: '', // Will be filled from criteria description if needed
        fileUrls: [],
        score,
      });
    }
  });
  
  return parsed;
}

/**
 * Get file name from URL
 */
export function getFileNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
}


