import { Type } from '@earendil-works/pi-ai';
import { defineTool, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import {
  generateHorizontalBarChart,
  generateSparkline,
  generateBudgetGauge,
  generateCashflowMeter
} from '../services/chart-generator.js';

export const renderChartTool = defineTool({
  name: 'render_chart',
  label: 'Render TUI Terminal Graph & Chart',
  description: 'Generates beautiful ASCII/Unicode horizontal bar graphs, trend sparklines, or budget progress gauges to embed directly into responses.',
  parameters: Type.Object({
    chartType: Type.String({ description: 'Type of chart: "bar" (category breakdown), "sparkline" (time-series trend), "gauge" (budget target), "cashflow" (in vs out)' }),
    title: Type.Optional(Type.String({ description: 'Chart title header' })),
    data: Type.Optional(Type.Array(Type.Object({
      label: Type.String({ description: 'Category or bar label' }),
      value: Type.Number({ description: 'Numeric amount or value' })
    }), { description: 'Data array for bar charts' })),
    values: Type.Optional(Type.Array(Type.Number(), { description: 'Numeric array for sparkline time-series trends' })),
    actual: Type.Optional(Type.Number({ description: 'Actual spend for gauge' })),
    budget: Type.Optional(Type.Number({ description: 'Budget target limit for gauge' })),
    inflow: Type.Optional(Type.Number({ description: 'Total inflow for cashflow meter' })),
    outflow: Type.Optional(Type.Number({ description: 'Total outflow for cashflow meter' }))
  }),

  async execute(_toolCallId, params) {
    let rendered = '';

    if (params.chartType === 'bar' && params.data) {
      const chart = generateHorizontalBarChart(params.data);
      rendered = `### 📊 ${params.title || 'Category Spending Breakdown'}\n${chart}`;
    } else if (params.chartType === 'sparkline' && params.values) {
      const spark = generateSparkline(params.values);
      rendered = `### 📈 ${params.title || 'Expense Trend Curve'}\n${spark}`;
    } else if (params.chartType === 'gauge' && params.actual !== undefined && params.budget !== undefined) {
      const gauge = generateBudgetGauge(params.title || 'Budget Target', params.actual, params.budget);
      rendered = gauge;
    } else if (params.chartType === 'cashflow' && params.inflow !== undefined && params.outflow !== undefined) {
      const meter = generateCashflowMeter(params.inflow, params.outflow);
      rendered = `### ⚖️ ${params.title || 'Cashflow Balance'}\n${meter}`;
    } else {
      rendered = 'Unable to render chart: invalid parameters provided.';
    }

    return {
      content: [{ type: 'text', text: rendered }],
      details: { rendered }
    };
  }
});

export default function (pi: ExtensionAPI) {
  pi.registerTool(renderChartTool);
}
