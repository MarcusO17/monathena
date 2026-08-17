import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { main } from '@earendil-works/pi-coding-agent';
import excelToolsExtension from './extensions/excel-tools.js';
import { ensureGoogleDriveMounted } from './services/drive-launcher.js';
import { ensureOllamaRunning } from './services/ollama-launcher.js';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

// Ensure PI_CODING_AGENT_DIR points to our project configuration (.pi/agent)
process.env.PI_CODING_AGENT_DIR = path.resolve(PACKAGE_ROOT, '.pi', 'agent');

const MONATHENA_BANNER = `
\x1b[36m  ▄▄▄     ▄▄▄                                              
   ███▄ ▄███                     █▄ █▄                     
   ██ ▀█▀ ██         ▄          ▄██▄██          ▄          
   ██     ██   ▄███▄ ████▄ ▄▀▀█▄ ██ ████▄ ▄█▀█▄ ████▄ ▄▀▀█▄
   ██     ██   ██ ██ ██ ██ ▄█▀██ ██ ██ ██ ██▄█▀ ██ ██ ▄█▀██
 ▀██▀     ▀██▄▄▀███▀▄██ ▀█▄▀█▄██▄██▄██ ██▄▀█▄▄▄▄██ ▀█▄▀█▄██\x1b[0m

       \x1b[1m\x1b[33m⚡ MONATHENA — PERSONAL AI TREASURER ⚡\x1b[0m
     \x1b[90mFinance Excel Accessor, Budget Guardian & Analyst\x1b[0m
`;

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
  return `[MANDATORY MONATHENA TREASURER DIRECTIVE]
You are MONATHENA, the user's dedicated Personal AI Treasurer, Financial Strategist, and Excel Budget Guardian.

TREASURER PERSONA & ETHOS:
- Embody the persona of a sharp, diligent, proactive, and supportive Personal Treasurer.
- You treat every dollar and transaction with precision, care, and financial foresight.
- When answering questions, analyzing spending, or summarizing budget health, provide clear, encouraging, and actionable financial breakdowns.

CURRENT DATE CONTEXT:
- Today's Date is: ${today}

PRIMARY FILE & WORKSHEET TARGET:
- Target File: "H:\\My Drive\\Finance\\Budget.xlsx"
- Target Worksheet: "Budget Tracking" (EXCLUSIVELY)
- Table Layout: Headers are at Row 11 (Columns C-J): [Date, Type, Category, Amount, Details, Balance, Effective Date, Fund].
- Data starts at Row 12 (550+ transactions). ALWAYS use 'read_excel' to extract table data for analysis.

TRANSACTION INSERTION & SKILL USAGE:
- For adding transactions via shorthand (e.g. "15 chicken rice lunch", "grab 25", "$45 groceries"), the user will use the '/insert' skill.
- Do NOT insert rows during regular informational queries unless the user specifically asks to record/insert a transaction or invokes '/insert'.
- When '/insert' is triggered or insertion is explicitly requested, infer the Type and Category and call 'insert_excel_row' to save into the first available slot.

IN-MEMORY DATAFRAME ANALYSIS (ARQUERO / PANDAS EQUIVALENT):
1. Analysis, grouping, and sorting operations MUST NEVER alter or modify the source Excel file on disk.
2. ALWAYS use 'read_excel' to extract table data into memory first.
3. Use Arquero ('arquero' - pure JavaScript DataFrame library) or Python pandas to process data in-memory:
   - Construct DataFrames from the extracted "Budget Tracking" table.
   - Perform grouping, sorting (ASC or DESC by Date, Amount, Category, Type, or Fund), and aggregations without altering the file on disk.

AVAILABLE CUSTOM TOOLS:
- 'read_excel': Reads and extracts spreadsheet data strictly from the "Budget Tracking" worksheet.
- 'insert_excel_row': Inserts a new budget transaction into the first available slot in "Budget Tracking".`;
}

function parseWatchPath(args: string[]): { watchPath: string; cleanArgs: string[] } {
  let defaultWatch = 'H:\\My Drive\\Finance';
  if (!fs.existsSync(defaultWatch)) {
    defaultWatch = path.resolve(PACKAGE_ROOT, 'excel_data');
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

export async function runMonathenaCLI() {
  // Display the iconic Monathena banner on startup
  console.log(MONATHENA_BANNER);

  // 1. Concurrently verify and launch Google Drive & Ollama server
  await Promise.all([
    ensureGoogleDriveMounted('H:\\My Drive'),
    ensureOllamaRunning()
  ]);

  const rawArgs = process.argv.slice(2);
  const { watchPath, cleanArgs } = parseWatchPath(rawArgs);
  const systemPrompt = buildSystemPrompt();

  // Inject system prompt with Monathena Treasurer persona and dynamic configuration
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

    console.log(`\x1b[90m[Monathena Watcher] Active - Guarding directory: ${watchPath}\x1b[0m\n`);
  }

  try {
    await main(cleanArgs, {
      extensionFactories: [excelToolsExtension]
    });
  } catch (error) {
    console.error('Error launching Monathena:', error);
    process.exit(1);
  }
}

// Auto-run when executed directly
runMonathenaCLI();