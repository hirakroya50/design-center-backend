import { aggregateLeads } from './lead-stats';

describe('aggregateLeads', () => {
  const visitors = [
    { stage: 'new', leadSource: 'Walk-in' },
    { stage: 'won', leadSource: 'Walk-in' },
    { stage: 'contacted', leadSource: 'Instagram' },
    { stage: 'lost', leadSource: 'Reference' },
  ];

  it('counts pipeline stages in canonical order', () => {
    const { pipeline } = aggregateLeads(visitors);
    expect(pipeline.map((p) => p.stage)).toEqual([
      'new',
      'contacted',
      'consultation',
      'won',
      'lost',
    ]);
    expect(pipeline.find((p) => p.stage === 'won')!.count).toBe(1);
    expect(pipeline.find((p) => p.stage === 'consultation')!.count).toBe(0);
  });

  it('computes lead-source counts and percentages over canonical sources', () => {
    const { leadSources } = aggregateLeads(visitors);
    const walkin = leadSources.find((s) => s.source === 'Walk-in')!;
    expect(walkin.count).toBe(2);
    expect(walkin.pct).toBe(50);
    expect(leadSources.map((s) => s.source)).toEqual([
      'Walk-in',
      'Reference',
      'Instagram',
      'Website',
      'Other',
    ]);
  });

  it('maps unknown/null lead source to Other', () => {
    const { leadSources } = aggregateLeads([
      { stage: 'new', leadSource: null },
      { stage: 'new', leadSource: 'Facebook' },
    ]);
    expect(leadSources.find((s) => s.source === 'Other')!.count).toBe(2);
  });

  it('conversionRate = won / total, rounded to 2dp', () => {
    expect(aggregateLeads(visitors).conversionRate).toBe(0.25);
  });

  it('handles empty input without dividing by zero', () => {
    const r = aggregateLeads([]);
    expect(r.conversionRate).toBe(0);
    expect(r.leadSources.every((s) => s.pct === 0)).toBe(true);
  });
});
