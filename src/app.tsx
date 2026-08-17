import path from 'path';
import { main } from '@earendil-works/pi-coding-agent';

// Ensure PI_CODING_AGENT_DIR points to our local project configuration (.pi/agent)
process.env.PI_CODING_AGENT_DIR = path.resolve(process.cwd(), '.pi', 'agent');

async function start() {
  const args = process.argv.slice(2);
  
  // Enforce --no-skills flag to disable loading skills
  if (!args.includes('--no-skills') && !args.includes('-ns')) {
    args.push('--no-skills');
  }

  try {
    await main(args);
  } catch (error) {
    console.error('Error launching Pi agent:', error);
    process.exit(1);
  }
}

start();