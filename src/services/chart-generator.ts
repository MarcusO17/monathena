/**
 * Monathena TUI Chart & Visual Graph Engine
 * High-resolution Unicode terminal bar charts, sparklines, and financial gauges.
 */

export interface ChartDataPoint {
  label: string;
  value: number;
}

export function generateHorizontalBarChart(
  data: ChartDataPoint[],
  maxWidth: number = 28
): string {
  if (!data || data.length === 0) return '';

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const maxLabelLen = Math.max(...data.map(d => d.label.length), 6);

  let output = '```text\n';
  for (const item of data) {
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
    const filledLen = Math.max(1, Math.round((item.value / maxVal) * maxWidth));
    const emptyLen = Math.max(0, maxWidth - filledLen);
    const bar = '█'.repeat(filledLen) + '░'.repeat(emptyLen);
    const paddedLabel = item.label.padEnd(maxLabelLen, ' ');
    const formattedVal = `$${item.value.toFixed(2)}`.padStart(10, ' ');
    output += `${paddedLabel} │ ${bar} │ ${formattedVal} (${pct}%)\n`;
  }
  output += '```';
  return output;
}

export function generateSparkline(values: number[]): string {
  if (!values || values.length === 0) return '';
  const sparks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const sparklineStr = values.map(v => {
    const idx = Math.min(sparks.length - 1, Math.floor(((v - min) / range) * (sparks.length - 1)));
    return sparks[idx];
  }).join('');

  return `\`${sparklineStr}\` (Min: $${min.toFixed(0)} → Peak: $${max.toFixed(0)})`;
}

export function generateBudgetGauge(
  label: string,
  actual: number,
  budget: number,
  width: number = 24
): string {
  const ratio = budget > 0 ? actual / budget : 0;
  const pct = (ratio * 100).toFixed(1);
  const filled = Math.min(width, Math.max(0, Math.round(ratio * width)));
  const empty = Math.max(0, width - filled);
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const status = ratio > 1 ? '⚠️ OVER BUDGET' : '✔ ON TRACK';

  return `**${label}**\n\`[${bar}]\` **${pct}%** ($${actual.toFixed(2)} / $${budget.toFixed(2)}) — ${status}`;
}

export function generateCashflowMeter(inflow: number, outflow: number, width: number = 28): string {
  const net = inflow - outflow;
  const total = inflow + outflow || 1;
  const inRatio = Math.round((inflow / total) * width);
  const outRatio = Math.max(0, width - inRatio);
  const meter = '🟩'.repeat(Math.round(inRatio / 2)) + '🟥'.repeat(Math.round(outRatio / 2));

  return `
\`\`\`text
Inflow  (+$${inflow.toFixed(2)})  ${'█'.repeat(inRatio)}
Outflow (-$${outflow.toFixed(2)})  ${'▒'.repeat(outRatio)}
Net Position: ${net >= 0 ? '+' : '-'}$${Math.abs(net).toFixed(2)} (${((net / (inflow || 1)) * 100).toFixed(1)}% Saved)
\`\`\`
`;
}
