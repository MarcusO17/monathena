/**
 * Monathena Terminal Visual & Animation Suite
 * High-end financial treasurer visuals, money animations, and elegant headliners.
 */

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const GOLD = '\x1b[38;2;255;215;0m';
const AMBER = '\x1b[38;2;255;179;0m';
const EMERALD = '\x1b[38;2;46;204;113m';
const CYAN = '\x1b[38;2;0;210;255m';
const SAPPHIRE = '\x1b[38;2;74;144;226m';
const PURPLE = '\x1b[38;2;167;139;250m';
const DIM = '\x1b[90m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

export async function playMonathenaIntroAnimation(): Promise<void> {
  // Clear console or scroll down cleanly
  console.clear();

  const frames = [
    `   ${GOLD}· · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·${RESET}`,
    `   ${EMERALD}✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦${RESET}`,
    `   ${GOLD}💰  💎  🏛️   MONATHENA EXECUTIVE FINANCIAL SUITE   🏛️  💎  💰${RESET}`,
    `   ${CYAN}═════════════════════════════════════════════════════════════════════════════════${RESET}`
  ];

  for (const frame of frames) {
    console.log(frame);
    await sleep(40);
  }

  // Elegant Monathena Luxury Monogram & Banner
  const bannerArt = `
${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════════╗
   ║                                                                               ║
   ║    ${GOLD}▄▄▄     ▄▄▄                                              ${CYAN}                  ║
   ║     ${GOLD}███▄ ▄███                     █▄ █▄                     ${CYAN}                  ║
   ║     ${GOLD}██ ▀█▀ ██         ▄          ▄██▄██          ▄          ${CYAN}                  ║
   ║     ${GOLD}██     ██   ▄███▄ ████▄ ▄▀▀█▄ ██ ████▄ ▄█▀█▄ ████▄ ▄▀▀█▄${CYAN}                  ║
   ║     ${GOLD}██     ██   ██ ██ ██ ██ ▄█▀██ ██ ██ ██ ██▄█▀ ██ ██ ▄█▀██${CYAN}                  ║
   ║   ${GOLD}▀██▀     ▀██▄▄▀███▀▄██ ▀█▄▀█▄██▄██▄██ ██▄▀█▄▄▄▄██ ▀█▄▀█▄██${CYAN}                  ║
   ║                                                                               ║
   ║        ${BOLD}${AMBER}🏛️  M O N A T H E N A  —  P E R S O N A L   T R E A S U R E R${RESET}${CYAN}        ║
   ║        ${DIM}Spreadsheet Guardian · Strategic Cashflow Architect · Portfolio Analyst${RESET}${CYAN} ║
   ╚═══════════════════════════════════════════════════════════════════════════════╝${RESET}
`;

  console.log(bannerArt);

  // Shimmering money status bar animation
  process.stdout.write(`   ${GOLD}💎 Initializing Vault Security & Excel Automation${RESET} `);
  const sparklers = ['[ 🪙    ]', '[ 🪙🪙  ]', '[ 🪙🪙🪙 ]', '[ ✨💎✨ ]'];
  for (const spark of sparklers) {
    process.stdout.write(`\r   ${GOLD}💎 Initializing Vault Security & Excel Automation${RESET} ${EMERALD}${spark}${RESET}`);
    await sleep(100);
  }
  process.stdout.write(`\r   ${EMERALD}✔ Vault Active & Connected to Google Drive${RESET} ${DIM}[H:\\My Drive\\Finance\\Budget.xlsx]${RESET}\n\n`);
}
