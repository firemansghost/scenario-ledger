/**
 * Derives a human-readable label for a forecast period from its date range.
 * Used across ForecastAtAGlance, PublishedForecastSummary, ScenarioComparisonGrid.
 */
export function derivePeriodLabel(
  startDate: string,
  endDate: string,
  existingLabel?: string
): string {
  if (existingLabel?.trim()) return existingLabel.trim();

  const start = new Date(startDate);
  const end = new Date(endDate);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  const monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

  if (startYear === endYear) {
    if (monthsDiff <= 4) {
      const season = getSeasonFromMonth(startMonth);
      return `${season} ${startYear}`;
    }
    if (monthsDiff <= 3) {
      const q = Math.floor(startMonth / 3) + 1;
      return `Q${q} ${startYear}`;
    }
    return String(startYear);
  }

  return `${startYear}–${endYear}`;
}

export function isLongSingleYearPeriod(
  periods: { start: string; end: string }[],
  minMonths = 9
): boolean {
  if (periods.length !== 1) return false;
  const p = periods[0];
  const start = new Date(p.start);
  const end = new Date(p.end);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return months >= minMonths && start.getFullYear() === end.getFullYear();
}

function getSeasonFromMonth(month: number): string {
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

/**
 * Maps timeline bullets to seasons for a year.
 * Bullets often have prefixes like "Feb–Mar", "Apr–May", "Jun–Aug", "Sep–Oct", "Nov–Dec".
 */
/** Longer patterns first so "Feb–Mar" matches before "Feb". Match hyphen or en-dash. */
const SEASON_MAPPINGS: { pattern: RegExp; season: string }[] = [
  { pattern: /^Nov[-–]Dec|^Dec[-–]Jan|^Jan[-–]Feb|^Feb[-–]Mar/, season: "Winter" },
  { pattern: /^Apr[-–]May|^Mar[-–]Apr|^Mar[-–]May|^Mar\b|^Apr\b|^May\b/, season: "Spring" },
  { pattern: /^Jun[-–]Aug|^May[-–]Jun|^Jul[-–]Aug|^Jun\b|^Jul\b|^Aug\b/, season: "Summer" },
  { pattern: /^Sep[-–]Oct|^Sep[-–]Nov|^Oct[-–]Nov|^Sep\b|^Oct\b|^Nov\b/, season: "Fall" },
  { pattern: /^Dec\b|^Jan\b|^Feb\b/, season: "Winter" },
];

export function assignBulletsToSeasons(
  bullets: string[],
  _year: number
): Record<string, string[]> {
  const result: Record<string, string[]> = {
    Spring: [],
    Summer: [],
    Fall: [],
    Winter: [],
  };

  for (const bullet of bullets) {
    const bulletTrim = bullet.trim();
    let assigned = false;
    for (const { pattern, season } of SEASON_MAPPINGS) {
      if (pattern.test(bulletTrim)) {
        result[season].push(bullet);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      result.Fall.push(bullet);
    }
  }

  return result;
}
