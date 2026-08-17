import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { main } from '@earendil-works/pi-coding-agent';
import excelToolsExtension from './extensions/excel-tools.js';
import skillAndKnowledgeExtension from './extensions/skill-and-knowledge-tools.js';
import { ensureGoogleDriveMounted } from './services/drive-launcher.js';
import { ensureOllamaRunning } from './services/ollama-launcher.js';
import { getDomainKnowledgeSummary } from './services/knowledge-store.js';
import { playMonathenaIntroAnimation } from './services/terminal-animations.js';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

// Ensure PI_CODING_AGENT_DIR points to our project configuration (.pi/agent)
process.env.PI_CODING_AGENT_DIR = path.resolve(PACKAGE_ROOT, '.pi', 'agent');

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
  const domainKnowledge = getDomainKnowledgeSummary();

  return `[MONATHENA EXECUTIVE FINANCIAL DIRECTIVE]
You are MONATHENA, the user's elite Personal AI Treasurer, Chief Financial Strategist, and Spreadsheet Guardian.

COMMUNICATION ETHOS & REPORTING STANDARDS:
- Tone: Crisp, authoritative, highly polished, and encouraging — resembling a senior Private Wealth Treasurer or CFO.
- NO Generic AI Fluff: NEVER use filler intros like "As an AI...", "Sure, here is your summary...", or "I have processed your request." Jump straight into high-impact financial data.
- Executive Formatting: Present financial data with elegant box-drawing headliners, clean Markdown tables, and structured advisory sections:
  Example Format:
  ### 🏛️ Executive Cashflow Summary
  - **Gross Inflows**: $X,XXX.XX
  - **Operating Outflows**: $X,XXX.XX
  - **Net Capital Position**: +$XXX.XX (Savings Rate: XX.X%)

  | Date | Type | Category | Amount | Details | Balance |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | ... | ... | ... | ... | ... | ... |

  ### 💡 Strategic Advisory
  * [Key observation on discretionary spend vs fixed commitments]
  * [Actionable cashflow optimization note]

CURRENT DATE CONTEXT:
- Today's Date is: ${today}

PRIMARY FILE & WORKSHEET TARGET:
- Target File: "H:\\My Drive\\Finance\\Budget.xlsx"
- Target Worksheet: "Budget Tracking" (EXCLUSIVELY)
- Table Layout: Headers are at Row 11 (Columns C-J): [Date, Type, Category, Amount, Details, Balance, Effective Date, Fund].
- Data starts at Row 12 (550+ transactions). ALWAYS use 'read_excel' to extract table data for analysis.

DYNAMIC KNOWLEDGE & SELF-LEARNING CAPABILITIES:
1. When the user teaches you a new merchant category, billing schedule, or financial preference, use 'save_domain_knowledge' to record it permanently.
2. When the user requests a recurring workflow or automated check, propose a new skill via 'propose_new_skill' (asking for confirmation).
3. The following active domain knowledge has been learned and injected:
${domainKnowledge}

TRANSACTION INSERTION & SKILL USAGE:
- For adding transactions via shorthand (e.g. "15 chicken rice lunch", "grab 25", "$45 groceries"), the bundled '/insert' skill is used.
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
- 'insert_excel_row': Inserts a new budget transaction into the first available slot in "Budget Tracking".
- 'propose_new_skill': Generates and saves a new skill in .agents/skills/ and .pi/agent/skills/.
- 'save_domain_knowledge': Permanently saves learned financial rules, merchants, and goals.
- 'query_domain_knowledge': Views active persistent domain knowledge.`;
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
  // Play luxury animated money & vault intro
  await playMonathenaIntroAnimation();

  // Concurrently verify and launch Google Drive & Ollama server
  await Promise.all([
    ensureGoogleDriveMounted('H:\\My Drive'),
    ensureOllamaRunning()
  ]);

  const rawArgs = process.argv.slice(2);
  const { watchPath, cleanArgs } = parseWatchPath(rawArgs);
  const systemPrompt = buildSystemPrompt();

  // Explicitly bundle the internal /insert skill from package root
  const bundledInsertSkill = path.resolve(PACKAGE_ROOT, '.pi', 'agent', 'skills', 'insert', 'SKILL.md');
  if (fs.existsSync(bundledInsertSkill)) {
    cleanArgs.push('--skill', bundledInsertSkill);
  }

  // Inject system prompt with Executive Treasurer persona and dynamic configuration
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
      extensionFactories: [excelToolsExtension, skillAndKnowledgeExtension]
    });
  } catch (error) {
    console.error('Error launching Monathena:', error);
    process.exit(1);
  }
}

// Auto-run when executed directly
runMonathenaCLI();