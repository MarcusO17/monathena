import path from 'path';
import fs from 'fs';
import { main } from '@earendil-works/pi-coding-agent';
import excelToolsExtension from './extensions/excel-tools.js';
import chokidar from 'chokidar';

// Ensure PI_CODING_AGENT_DIR points to our local project configuration (.pi/agent)
process.env.PI_CODING_AGENT_DIR = path.resolve(process.cwd(), '.pi', 'agent');

const TARGET_BUDGET_FILE = 'H:\\My Drive\\Finance\\Budget.xlsx';
const TARGET_SHEET_NAME = 'Budget Tracking';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildSystemPrompt(): string {
  const today = getTodayString();
  return `[MANDATORY BUDGET & SPREADSHEET DIRECTIVE]
You are Excel Agent, a dedicated AI assistant specialized in Budget Tracking Sheets.

CURRENT DATE CONTEXT:
- Today's Date is: ${today}
- When inserting transactions without an explicit date, use today's date (${today}).

PRIMARY FILE & WORKSHEET TARGET:
- Target File: "H:\\My Drive\\Finance\\Budget.xlsx"
- Target Worksheet: "Budget Tracking" (EXCLUSIVELY)
- Table Layout: Headers are at Row 11 (Columns C-J): [Date, Type, Category, Amount, Details, Balance, Effective Date, Fund].
- Data starts at Row 12 (550+ transactions). ALWAYS use 'read_excel' to automatically extract this table.

AUTOMATIC TYPE & CATEGORY INFERENCE (QUICK TRANSACTION INPUT):
When the user types only an amount and a brief description/merchant (e.g. "15 chicken rice lunch", "grab 25", "$45 groceries", "salary 4000"):
1. Automatically extract the Amount (e.g. 15.00) and Details (e.g. "Chicken Rice Lunch").
2. Automatically use today's date (${today}) if date is not specified.
3. Automatically INFER the Type:
   - 'Income': for salary, wages, bonus, cashback, refunds.
   - 'Savings': for stock purchases (VT, shares), investments, savings transfers.
   - 'Expenses': for all normal spending, food, transport, bills, shopping.
4. Automatically INFER the Category from this exact list:
   - Food & Meals: 'Dining Out', 'Cafeteria / Work Lunch'
   - Food Shopping: 'Groceries'
   - Travel & Rides: 'Transportation' (fuel, grab, parking, bus, toll)
   - Personal: 'Leisure and Personal Care' (haircut, games, movies)
   - Sports: 'Fitness' (gym, badminton, sports)
   - Home Bills: 'Utilities (Home)' (electricity, water, internet), 'Telecommunications' (mobile phone)
   - Family & Social: 'Family Commitment' (allowance), 'Social & Giving' (drinks, gifts)
   - Health & Safety: 'Medical' (doctor, pharmacy), 'Insurance'
   - Salary: 'Employment (Net)'
   - Investments: 'Stock Portfolio', 'Emergency Savings'
5. Immediately execute 'insert_excel_row' with the inferred Type and Category!

IN-MEMORY DATAFRAME ANALYSIS (ARQUERO / PANDAS EQUIVALENT):
1. Analysis, grouping, and sorting operations MUST NEVER alter or modify the source Excel file on disk.
2. ALWAYS use 'read_excel' to extract table data into memory first.
3. Use Arquero ('arquero' - pure JavaScript DataFrame library) or Python pandas to process data in-memory:
   - Construct DataFrames from the extracted "Budget Tracking" table.
   - Perform grouping, sorting (ASC or DESC by Date, Amount, Category, Type, or Fund), and aggregations without altering the file on disk.

FILE MODIFICATIONS:
- Use 'insert_excel_row' to insert new budget rows (which automatically uses safe openpyxl preserving all sheet XML and table schemas).
- NEVER view raw .xlsx files with text reader tools (to avoid unreadable XML output).

AVAILABLE CUSTOM TOOLS:
- 'read_excel': Reads and extracts spreadsheet data strictly from the "Budget Tracking" worksheet.
- 'insert_excel_row': Inserts a new budget transaction into the "Budget Tracking" worksheet.
- 'write_excel': Writes or creates Excel workbooks cleanly.`;
}

function parseWatchPath(args: string[]): { watchPath: string; cleanArgs: string[] } {
  let defaultWatch = 'H:\\My Drive\\Finance';
  if (!fs.existsSync(defaultWatch)) {
    defaultWatch = path.resolve(process.cwd(), 'excel_data');
  }

  let watchPath: string = process.env.WATCH_PATH || defaultWatch;
  const cleanArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--watch' || args[i] === '-w') {
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        watchPath = path.resolve(process.cwd(), args[i + 1]);
        i++;
      }
      continue;
    }
    cleanArgs.push(args[i]);
  }

  return { watchPath, cleanArgs };
}

async function start() {
  const rawArgs = process.argv.slice(2);
  const { watchPath, cleanArgs } = parseWatchPath(rawArgs);
  const systemPrompt = buildSystemPrompt();

  // Enforce --no-skills flag to disable loading default skills
  if (!cleanArgs.includes('--no-skills') && !cleanArgs.includes('-ns')) {
    cleanArgs.push('--no-skills');
  }

  // Inject system prompt with dynamic current date and automatic inference rules
  cleanArgs.push('--system-prompt', systemPrompt);
  cleanArgs.push('--append-system-prompt', systemPrompt);

  // Initialize spreadsheet file watcher
  if (watchPath) {
    if (!fs.existsSync(watchPath)) {
      fs.mkdirSync(watchPath, { recursive: true });
    }

    const watcher = chokidar.watch(watchPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('add', (filePath) => {
      if (/\.(xlsx|xls|csv)$/i.test(filePath)) {
        console.log(`\n[Excel Watcher] 🟢 Spreadsheet added: ${path.basename(filePath)} (${filePath})`);
      }
    });

    watcher.on('change', (filePath) => {
      if (/\.(xlsx|xls|csv)$/i.test(filePath)) {
        console.log(`\n[Excel Watcher] 🟡 Spreadsheet updated: ${path.basename(filePath)} (${filePath})`);
      }
    });

    watcher.on('unlink', (filePath) => {
      if (/\.(xlsx|xls|csv)$/i.test(filePath)) {
        console.log(`\n[Excel Watcher] 🔴 Spreadsheet removed: ${path.basename(filePath)}`);
      }
    });

    console.log(`[Excel Watcher] Active - Watching directory: ${watchPath}`);
  }

  try {
    await main(cleanArgs, {
      extensionFactories: [excelToolsExtension]
    });
  } catch (error) {
    console.error('Error launching Excel Agent:', error);
    process.exit(1);
  }
}

start();