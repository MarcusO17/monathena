import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const KNOWLEDGE_DIR = path.resolve(PACKAGE_ROOT, '.pi', 'agent', 'knowledge');

export interface KnowledgeEntry {
  category: 'merchants' | 'rules' | 'recurring' | 'goals' | 'notes';
  key: string;
  value: any;
  updatedAt: string;
}

export function initKnowledgeStore(): void {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }

  const defaultFiles = {
    'merchants.json': {
      "Keysight": { "category": "Employment (Net)", "type": "Income" },
      "Zus": { "category": "Dining Out", "type": "Expenses" },
      "Starbucks": { "category": "Dining Out", "type": "Expenses" },
      "Shopee": { "category": "Leisure and Personal Care", "type": "Expenses" },
      "Seven Star": { "category": "Fitness", "type": "Expenses" },
      "Rong Trading": { "category": "Groceries", "type": "Expenses" }
    },
    'rules.json': {
      "currency": "MYR",
      "budgetMethod": "50/30/20",
      "needsCategories": ["Groceries", "Housing", "Utilities (Home)", "Transportation", "Insurance", "Medical"],
      "wantsCategories": ["Dining Out", "Leisure and Personal Care", "Fitness", "Social & Giving"],
      "savingsCategories": ["Stock Portfolio", "Emergency Savings", "Sinking Fund"]
    },
    'recurring.json': {
      "salary": { "day": 26, "merchant": "Keysight", "category": "Employment (Net)" }
    }
  };

  for (const [filename, content] of Object.entries(defaultFiles)) {
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    }
  }
}

export function getDomainKnowledgeSummary(): string {
  initKnowledgeStore();
  let summary = '';

  try {
    const files = fs.readdirSync(KNOWLEDGE_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(KNOWLEDGE_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const topic = path.basename(file, '.json').toUpperCase();
        summary += `\n[DOMAIN KNOWLEDGE: ${topic}]\n${JSON.stringify(data, null, 2)}\n`;
      } else if (file.endsWith('.md') || file.endsWith('.txt')) {
        const filePath = path.join(KNOWLEDGE_DIR, file);
        const text = fs.readFileSync(filePath, 'utf8');
        const topic = path.basename(file).toUpperCase();
        summary += `\n[DOMAIN KNOWLEDGE: ${topic}]\n${text}\n`;
      }
    }
  } catch (err: any) {
    console.error('[KnowledgeStore] Error loading knowledge:', err.message);
  }

  return summary;
}

export function saveKnowledge(category: string, key: string, value: any): { success: boolean; filePath: string } {
  initKnowledgeStore();
  const filename = `${category.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.json`;
  const filePath = path.join(KNOWLEDGE_DIR, filename);

  let currentData: Record<string, any> = {};
  if (fs.existsSync(filePath)) {
    try {
      currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {}
  }

  currentData[key] = value;
  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), 'utf8');

  return { success: true, filePath };
}
