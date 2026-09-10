export interface ParsedReleaseNotes {
  features: string[];
  fixes: string[];
  improvements: string[];
}

export function parseReleaseNotes(markdown: string): ParsedReleaseNotes {
  const result: ParsedReleaseNotes = {
    features: [],
    fixes: [],
    improvements: [],
  };

  if (!markdown) return result;

  const lines = markdown.split('\n');
  let currentCategory: keyof ParsedReleaseNotes | null = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for headers (e.g., "### Features", "## Bug Fixes", "Improvements:")
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('feature')) {
      currentCategory = 'features';
      continue;
    } else if (lowerLine.includes('fix') || lowerLine.includes('bug')) {
      currentCategory = 'fixes';
      continue;
    } else if (lowerLine.includes('improve') || lowerLine.includes('update') || lowerLine.includes('change')) {
      currentCategory = 'improvements';
      continue;
    }

    // Check for bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const item = line.substring(2).trim();
      if (item) {
        if (currentCategory) {
          result[currentCategory].push(item);
        } else {
          // If no category matched yet, default to improvements
          result.improvements.push(item);
        }
      }
    } else if (currentCategory && !line.startsWith('#')) {
       // Support lines that don't have bullets but fall under a category
       result[currentCategory].push(line);
    } else if (!currentCategory && !line.startsWith('#')) {
       // Generic fallback for unformatted text
       result.improvements.push(line);
    }
  }

  // Deduplicate and filter out empty strings
  result.features = [...new Set(result.features)].filter(Boolean);
  result.fixes = [...new Set(result.fixes)].filter(Boolean);
  result.improvements = [...new Set(result.improvements)].filter(Boolean);

  return result;
}
