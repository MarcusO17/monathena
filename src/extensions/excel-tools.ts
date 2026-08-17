import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Type } from '@earendil-works/pi-ai';
import { defineTool, type ExtensionAPI } from '@earendil-works/pi-coding-agent';

const execFileAsync = promisify(execFile);
const DEFAULT_BUDGET_PATH = 'H:\\My Drive\\Finance\\Budget.xlsx';
const DEFAULT_BUDGET_SHEET = 'Budget Tracking';

function formatDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    if (val.includes('T')) return val.split('T')[0];
    return val;
  }
  if (typeof val === 'object') {
    if ('result' in val && val.result) return formatDate(val.result);
    if ('text' in val && val.text) return formatDate(val.text);
  }
  return String(val);
}

function formatCell(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return formatDate(val);
  if (typeof val === 'object') {
    if ('result' in val) return val.result !== null && val.result !== undefined ? String(val.result) : '';
    if ('text' in val) return String(val.text ?? '');
    if ('richText' in val) return val.richText.map((rt: any) => rt.text).join('');
    if ('formula' in val) return String(val.result ?? `=${val.formula}`);
  }
  return String(val);
}

function findBudgetTrackingSheet(workbook: ExcelJS.Workbook, requestedSheet?: string): ExcelJS.Worksheet | undefined {
  if (requestedSheet) {
    const direct = workbook.getWorksheet(requestedSheet);
    if (direct) return direct;
    const match = workbook.worksheets.find(w => 
      w.name.trim().toLowerCase().replace(/\s+/g, '') === requestedSheet.trim().toLowerCase().replace(/\s+/g, '')
    );
    if (match) return match;
  }
  const trackingSheet = workbook.worksheets.find(w => 
    w.name.trim().toLowerCase().replace(/\s+/g, '') === 'budgettracking'
  );
  if (trackingSheet) return trackingSheet;
  return workbook.getWorksheet(DEFAULT_BUDGET_SHEET) || workbook.worksheets[0];
}

interface TableHeaderInfo {
  headerRowIndex: number;
  startColIndex: number;
  headers: string[];
}

function detectBudgetHeader(sheet: ExcelJS.Worksheet): TableHeaderInfo {
  for (let r = 1; r <= Math.min(30, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    const rawValues = (row.values as any[]) || [];
    for (let c = 1; c < rawValues.length; c++) {
      const cellVal = String(rawValues[c] || '').trim().toLowerCase();
      if (cellVal === 'date') {
        const nextCellVal = String(rawValues[c + 1] || '').trim().toLowerCase();
        if (nextCellVal === 'type') {
          const headers: string[] = [];
          for (let hc = c; hc < rawValues.length; hc++) {
            const h = String(rawValues[hc] || '').trim();
            if (!h && headers.length >= 5) break;
            headers.push(h);
          }
          return { headerRowIndex: r, startColIndex: c, headers };
        }
      }
    }
  }
  return {
    headerRowIndex: 11,
    startColIndex: 3,
    headers: ['Date', 'Type', 'Category', 'Amount', 'Details', 'Balance', 'Effective Date', 'Fund']
  };
}

export const readExcelTool = defineTool({
  name: 'read_excel',
  label: 'Read Budget Tracking Table',
  description: 'Accurately extracts and parses the Budget Tracking table from H:\\My Drive\\Finance\\Budget.xlsx into structured clean rows and statistics without mutating the file.',
  parameters: Type.Object({
    filePath: Type.Optional(Type.String({ description: 'Path to Excel file (defaults to H:\\My Drive\\Finance\\Budget.xlsx)' })),
    sheetName: Type.Optional(Type.String({ description: 'Worksheet name (defaults to Budget Tracking)' })),
    limit: Type.Optional(Type.Number({ description: 'Number of rows to return (default: all / recent 150 entries for display)' })),
    filterCategory: Type.Optional(Type.String({ description: 'Optional category filter' })),
    filterType: Type.Optional(Type.String({ description: 'Optional type filter (e.g. Income, Expenses)' }))
  }),

  async execute(_toolCallId, params) {
    const rawPath = params.filePath || DEFAULT_BUDGET_PATH;
    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        content: [{ type: 'text', text: `Budget file not found: ${resolvedPath}` }],
        details: { error: 'file_not_found' }
      };
    }

    try {
      const workbook = new ExcelJS.Workbook();
      if (resolvedPath.toLowerCase().endsWith('.csv')) {
        await workbook.csv.readFile(resolvedPath);
      } else {
        await workbook.xlsx.readFile(resolvedPath);
      }

      const sheet = findBudgetTrackingSheet(workbook, params.sheetName || DEFAULT_BUDGET_SHEET);
      if (!sheet) {
        return {
          content: [{ type: 'text', text: `Worksheet "Budget Tracking" not found in ${resolvedPath}.` }],
          details: { error: 'sheet_not_found' }
        };
      }

      const { headerRowIndex, startColIndex, headers } = detectBudgetHeader(sheet);
      const allRows: any[][] = [];
      let totalIncome = 0;
      let totalExpense = 0;

      for (let r = headerRowIndex + 1; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const dateRaw = row.getCell(startColIndex).value;
        const typeRaw = row.getCell(startColIndex + 1).value;
        const amountRaw = row.getCell(startColIndex + 3).value;

        if (!dateRaw && !typeRaw && !amountRaw) {
          continue;
        }

        const dateStr = formatDate(dateRaw);
        const typeStr = formatCell(typeRaw);
        const categoryStr = formatCell(row.getCell(startColIndex + 2).value);
        const amountVal = typeof amountRaw === 'number' ? amountRaw : parseFloat(formatCell(amountRaw)) || 0;
        const detailsStr = formatCell(row.getCell(startColIndex + 4).value);
        const balanceStr = formatCell(row.getCell(startColIndex + 5).value);
        const effectiveDateStr = formatDate(row.getCell(startColIndex + 6).value);
        const fundStr = formatCell(row.getCell(startColIndex + 7).value);

        if (params.filterCategory && !categoryStr.toLowerCase().includes(params.filterCategory.toLowerCase())) {
          continue;
        }
        if (params.filterType && !typeStr.toLowerCase().includes(params.filterType.toLowerCase())) {
          continue;
        }

        if (typeStr.toLowerCase().includes('income')) {
          totalIncome += amountVal;
        } else if (typeStr.toLowerCase().includes('expense')) {
          totalExpense += amountVal;
        }

        allRows.push([
          dateStr,
          typeStr,
          categoryStr,
          amountVal.toFixed(2),
          detailsStr,
          balanceStr,
          effectiveDateStr,
          fundStr
        ]);
      }

      const totalEntries = allRows.length;
      const displayLimit = params.limit || 150;
      const displayedRows = allRows.slice(Math.max(0, allRows.length - displayLimit));

      let md = `### Budget Tracking Table Overview\n`;
      md += `- **Source**: \`${path.basename(resolvedPath)}\` (Sheet: \`${sheet.name}\`)\n`;
      md += `- **Total Recorded Transactions**: **${totalEntries} rows**\n`;
      md += `- **Total Tracked Income**: **$${totalIncome.toFixed(2)}** | **Total Tracked Expenses**: **$${totalExpense.toFixed(2)}**\n`;
      md += `- **Table Headers (Row ${headerRowIndex}, Col ${startColIndex})**: \`${headers.join(' | ')}\`\n\n`;

      md += `| Date | Type | Category | Amount | Details | Balance | Effective Date | Fund |\n`;
      md += `| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
      for (const row of displayedRows) {
        md += `| ${row.join(' | ')} |\n`;
      }

      if (totalEntries > displayLimit) {
        md += `\n*Note: Showing the ${displayedRows.length} most recent entries out of ${totalEntries} total rows.*\n`;
      }

      return {
        content: [{ type: 'text', text: md }],
        details: {
          filePath: resolvedPath,
          sheetName: sheet.name,
          headerRow: headerRowIndex,
          totalRows: totalEntries,
          totalIncome,
          totalExpense,
          sampleRows: displayedRows
        }
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Failed to read Budget Tracking table: ${err.message}` }],
        details: { error: err.message }
      };
    }
  }
});

export const insertExcelRowTool = defineTool({
  name: 'insert_excel_row',
  label: 'Insert Row in Budget Tracking Sheet',
  description: 'Natively inserts a new transaction into the Excel Table preserving all formulas, table structure, and styles with 100% fidelity.',
  parameters: Type.Object({
    date: Type.Optional(Type.String({ description: 'Transaction date (YYYY-MM-DD, defaults to today)' })),
    type: Type.Optional(Type.String({ description: 'Transaction type: Income, Expenses, Savings, Transfer' })),
    category: Type.Optional(Type.String({ description: 'Category: e.g. Dining Out, Groceries, Transportation, Utilities (Home)' })),
    amount: Type.Optional(Type.Union([Type.Number(), Type.String()], { description: 'Numeric transaction amount' })),
    details: Type.Optional(Type.String({ description: 'Merchant or description' })),
    fund: Type.Optional(Type.String({ description: 'Account/wallet/fund name (optional)' })),
    filePath: Type.Optional(Type.String({ description: 'Path to Excel file (defaults to H:\\My Drive\\Finance\\Budget.xlsx)' }))
  }),

  async execute(_toolCallId, params) {
    const rawPath = params.filePath || DEFAULT_BUDGET_PATH;
    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        content: [{ type: 'text', text: `Budget file not found at: ${resolvedPath}` }],
        details: { error: 'file_not_found' }
      };
    }

    const ps1Path = path.resolve(process.cwd(), 'scripts', 'insert_row.ps1');
    const todayIso = new Date().toISOString().split('T')[0];
    const amountVal = typeof params.amount === 'string' ? parseFloat(params.amount) : (params.amount ?? 0);
    const payloadObj = {
      filePath: resolvedPath,
      date: params.date || todayIso,
      type: params.type || 'Expenses',
      category: params.category || 'Dining Out',
      amount: isNaN(amountVal) ? 0 : amountVal,
      details: params.details || '',
      fund: params.fund || ''
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64');

    try {
      const { stdout, stderr } = await execFileAsync('powershell', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', ps1Path,
        '-Base64Payload', base64Payload
      ]);

      if (stderr && stderr.trim()) {
        console.error('[insert_excel_row] PS Warning:', stderr);
      }
      
      const res = JSON.parse(stdout.trim());
      if (!res.success) {
        return {
          content: [{ type: 'text', text: `Failed to insert row: ${res.error}` }],
          details: { error: res.error }
        };
      }

      return {
        content: [{ type: 'text', text: `Successfully inserted new budget transaction into row ${res.row} of "Budget Tracking":\n- **Date**: ${res.date}\n- **Type**: ${res.type}\n- **Category**: ${res.category}\n- **Amount**: $${res.amount}\n- **Details**: ${res.details}${res.fund ? `\n- **Fund**: ${res.fund}` : ''}` }],
        details: res
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Failed to execute native Excel insertion: ${err.message}` }],
        details: { error: err.message }
      };
    }
  }
});

export default function (pi: ExtensionAPI) {
  pi.registerTool(readExcelTool);
  pi.registerTool(insertExcelRowTool);
}
