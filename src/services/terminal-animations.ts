/**
 * Monathena Minimalist Terminal UI
 * Sleek, clean, high-elegance minimalist front-page header with custom banner.
 */

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CYAN = '\x1b[38;2;86;182;194m';
const EMERALD = '\x1b[38;2;152;195;121m';
const AMBER = '\x1b[38;2;229;192;123m';
const DIM = '\x1b[90m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

export async function playMonathenaIntroAnimation(): Promise<void> {
  console.clear();

  const banner = `
${CYAN}                                                   ,,                                    
\`7MMM.     ,MMF'                            mm   \`7MM                                    
  MMMb    dPMM                              MM     MM                                    
  M YM   ,M MM  ,pW"Wq.\`7MMpMMMb.   ,6"Yb.mmMMmm   MMpMMMb.  .gP"Ya \`7MMpMMMb.   ,6"Yb.  
  M  Mb  M' MM 6W'   \`Wb MM    MM  8)   MM  MM     MM    MM ,M'   Yb  MM    MM  8)   MM  
  M  YM.P'  MM 8M     M8 MM    MM   ,pm9MM  MM     MM    MM 8M""""""  MM    MM   ,pm9MM  
  M  \`YM'   MM YA.   ,A9 MM    MM  8M   MM  MM     MM    MM YM.    ,  MM    MM  8M   MM  
.JML. \`'  .JMML.\`Ybmd9'.JMML  JMML.\`Moo9^Yo.\`Mbmo.JMML  JMML.\`Mbmmd'.JMML  JMML.\`Moo9^Yo.${RESET}

  ${DIM}────────────────────────────────────────────────────────────────────────────────────────${RESET}
  ${CYAN}◈ Vault${RESET}    ${DIM}H:\\My Drive\\Finance\\${RESET}${BOLD}Budget.xlsx${RESET} ${EMERALD}[Synced]${RESET}
  ${CYAN}◈ Sheet${RESET}    ${DIM}Worksheet:${RESET} ${AMBER}Budget Tracking${RESET}
  ${CYAN}◈ Quick${RESET}    ${DIM}Shorthand logging via${RESET} ${BOLD}/insert${RESET} ${DIM}(e.g. /insert 15 lunch)${RESET}
  ${DIM}────────────────────────────────────────────────────────────────────────────────────────${RESET}
`;

  console.log(banner);
}
