const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/APT-Rank_Git/functions/gate5_evidence_reconstructed.json', 'utf8'));

let md = `# PLAY-07.3 GATE 5: 360-Period Raw Evidence (Reconstructed)

## Preflight
\`\`\`json
${JSON.stringify(data.preflight, null, 2)}
\`\`\`

## Periods Evidence (Up to P296)
`;

data.periods.forEach(p => {
  md += `### Period ${p.period}\n`;
  md += `- **Batch ID**: \`${p.batch_id}\`\n`;
  md += `- **Expected Players**: ${p.expected_players}\n`;
  md += `- **Processed**: ${p.processed}\n`;
  md += `- **Chunk Count**: ${p.chunk_count}\n`;
  md += `- **Batch Status**: ${p.batch_status}\n`;
  md += `- **Decision Logs Created**: ${p.decision_logs}\n`;
  md += `- **Clock Advanced To**: ${p.clock_after}\n`;
  
  if (p.checkpoint) {
    md += `\n**Checkpoint Data (Period ${p.period})**:\n`;
    md += `- Total Assets: ${p.checkpoint.total_assets}\n`;
    md += `- Invariants Valid: ${p.checkpoint.invariants_valid}\n`;
    md += `- Anomalies: ${p.checkpoint.anomalies.length > 0 ? p.checkpoint.anomalies.join(', ') : 'None'}\n`;
  }
  md += `\n`;
});

fs.writeFileSync('C:/Users/anito/.gemini/antigravity-ide/brain/00379fbd-4806-4f05-b872-04995cefa8e9/PLAY-07.3_GATE5_360PERIOD_RAW_EVIDENCE.md', md);
