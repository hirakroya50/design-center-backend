export const LEAD_STAGES = [
  'new',
  'contacted',
  'consultation',
  'won',
  'lost',
] as const;
export const LEAD_SOURCES = [
  'Walk-in',
  'Reference',
  'Instagram',
  'Website',
  'Other',
] as const;

export type LeadRow = { stage: string | null; leadSource: string | null };

export function aggregateLeads(visitors: LeadRow[]) {
  const total = visitors.length;

  const pipeline = LEAD_STAGES.map((stage) => ({
    stage,
    count: visitors.filter((v) => (v.stage ?? 'new') === stage).length,
  }));

  const sourceCount: Record<string, number> = Object.fromEntries(
    LEAD_SOURCES.map((s) => [s, 0]),
  );
  for (const v of visitors) {
    const s =
      v.leadSource && (LEAD_SOURCES as readonly string[]).includes(v.leadSource)
        ? v.leadSource
        : 'Other';
    sourceCount[s] += 1;
  }
  const leadSources = LEAD_SOURCES.map((source) => ({
    source,
    count: sourceCount[source],
    pct: total > 0 ? Math.round((sourceCount[source] / total) * 100) : 0,
  }));

  const won = pipeline.find((p) => p.stage === 'won')!.count;
  const conversionRate = total > 0 ? Math.round((won / total) * 100) / 100 : 0;

  return { pipeline, leadSources, conversionRate };
}
