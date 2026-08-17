import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Type } from '@earendil-works/pi-ai';
import { defineTool, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { saveKnowledge, getDomainKnowledgeSummary } from '../services/knowledge-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

export const proposeNewSkillTool = defineTool({
  name: 'propose_new_skill',
  label: 'Propose / Create New Skill',
  description: 'Proposes and generates a new persistent skill in .agents/skills/ and .pi/agent/skills/ with user approval.',
  parameters: Type.Object({
    skillName: Type.String({ description: 'Short slug identifier for the skill (e.g. tax_deduction_audit, subscription_tracker)' }),
    description: Type.String({ description: 'Brief 1-2 sentence description of when and how the skill is used' }),
    instructions: Type.String({ description: 'Detailed markdown instructions and step-by-step guidance for the skill' })
  }),

  async execute(_toolCallId, params) {
    const slug = params.skillName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const skillContent = `---
name: ${slug}
description: ${params.description}
---

# ${params.skillName.replace(/_/g, ' ').toUpperCase()} Skill

${params.instructions}
`;

    const piSkillDir = path.resolve(PACKAGE_ROOT, '.pi', 'agent', 'skills', slug);
    const agentSkillDir = path.resolve(PACKAGE_ROOT, '.agents', 'skills', slug);

    try {
      fs.mkdirSync(piSkillDir, { recursive: true });
      fs.mkdirSync(agentSkillDir, { recursive: true });

      fs.writeFileSync(path.join(piSkillDir, 'SKILL.md'), skillContent, 'utf8');
      fs.writeFileSync(path.join(agentSkillDir, 'SKILL.md'), skillContent, 'utf8');

      return {
        content: [{
          type: 'text',
          text: `### 🌟 New Skill Created: \`/${slug}\`\n\n- **Name**: \`${params.skillName}\`\n- **Description**: ${params.description}\n- **Locations**:\n  - \`.pi/agent/skills/${slug}/SKILL.md\`\n  - \`.agents/skills/${slug}/SKILL.md\`\n\nThis skill is now permanently available for future sessions!`
        }],
        details: { skillName: slug, success: true }
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Failed to create skill: ${err.message}` }],
        details: { error: err.message }
      };
    }
  }
});

export const saveDomainKnowledgeTool = defineTool({
  name: 'save_domain_knowledge',
  label: 'Store Domain Knowledge & Financial Rules',
  description: 'Permanently saves financial domain knowledge (merchants, rules, recurring dates, budget targets) to be automatically loaded in future sessions.',
  parameters: Type.Object({
    category: Type.String({ description: 'Knowledge category: "merchants", "rules", "recurring", "goals", "notes"' }),
    key: Type.String({ description: 'Identifier or merchant/rule name (e.g. "Family Allowance", "McDonalds")' }),
    value: Type.String({ description: 'Value, rule description, or JSON metadata (e.g. {"category": "Dining Out", "type": "Expenses"})' })
  }),

  async execute(_toolCallId, params) {
    let parsedValue: any = params.value;
    try {
      parsedValue = JSON.parse(params.value);
    } catch {}

    try {
      const res = saveKnowledge(params.category, params.key, parsedValue);
      return {
        content: [{
          type: 'text',
          text: `### 🧠 Domain Knowledge Recorded\n- **Category**: \`${params.category}\`\n- **Key**: \`${params.key}\`\n- **Stored In**: \`${path.basename(res.filePath)}\`\n\nMonathena will automatically inject this learned knowledge into all future prompts!`
        }],
        details: { category: params.category, key: params.key, success: true }
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Failed to save knowledge: ${err.message}` }],
        details: { error: err.message }
      };
    }
  }
});

export const queryDomainKnowledgeTool = defineTool({
  name: 'query_domain_knowledge',
  label: 'Query Domain Knowledge',
  description: 'Retrieves active persistent domain knowledge and rules.',
  parameters: Type.Object({}),

  async execute() {
    const summary = getDomainKnowledgeSummary();
    return {
      content: [{ type: 'text', text: summary || 'No extra domain knowledge stored yet.' }],
      details: { summary }
    };
  }
});

export default function (pi: ExtensionAPI) {
  pi.registerTool(proposeNewSkillTool);
  pi.registerTool(saveDomainKnowledgeTool);
  pi.registerTool(queryDomainKnowledgeTool);
}
