const fs = require('fs');
let content = fs.readFileSync('src/App.js', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

const findLine = (text) => lines.findIndex(l => l.includes(text));

const dbCommentLine = findLine('// ✅ KT West(세종대로 178)');
const optionsLine = findLine('const OPTIONS = {');
const budgetCompatLine = findLine('const BUDGET_COMPAT = {');
const extractBrandLine = findLine('function extractBrand(');
const quickPresetsLine = findLine('const QUICK_PRESETS = [');
const exportLine = findLine('export default function LunchRecommender');

console.log('dbComment:', dbCommentLine + 1);
console.log('OPTIONS:', optionsLine + 1);
console.log('budgetCompat:', budgetCompatLine + 1);
console.log('extractBrand:', extractBrandLine + 1);
console.log('QUICK_PRESETS:', quickPresetsLine + 1);
console.log('export:', exportLine + 1);

// Find end of BUDGET_COMPAT block
let budEndLine = budgetCompatLine;
let depth = 0;
for (let i = budgetCompatLine; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        budEndLine = i;
        break;
      }
    }
  }
  if (depth === 0 && budEndLine > budgetCompatLine) break;
}
console.log('BUDGET_COMPAT ends at line:', budEndLine + 1);

// Find end of QUICK_PRESETS block
let qpEndLine = quickPresetsLine;
depth = 0;
for (let i = quickPresetsLine; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '[') depth++;
    if (ch === ']') {
      depth--;
      if (depth === 0) {
        qpEndLine = i;
        break;
      }
    }
  }
  if (depth === 0 && qpEndLine > quickPresetsLine) break;
}
console.log('QUICK_PRESETS ends at line:', qpEndLine + 1);

// Build new content
const importDB = 'import { restaurantDB } from "./data/restaurantData";';
const importConst = 'import { OPTIONS, LABELS, SECTION_TITLES, BUDGET_COMPAT, QUICK_PRESETS } from "./data/constants";';

const newLines = [
  lines[0],  // import React
  importDB,
  importConst,
  ...lines.slice(1, dbCommentLine), // lines 2 to before DB comment (empty line before it)
  // Skip: restaurantDB (dbCommentLine to optionsLine-1)
  // Skip: OPTIONS/LABELS/SECTION_TITLES/BUDGET_COMPAT (optionsLine to budEndLine)
  '',  // blank separator
  // Keep: extractBrand and below until QUICK_PRESETS
  ...lines.slice(extractBrandLine, quickPresetsLine - 1),
  // Skip: QUICK_PRESETS (quickPresetsLine to qpEndLine)
  '',
  // Keep: export default and everything after
  ...lines.slice(exportLine),
];

console.log('New line count:', newLines.length, '(was', lines.length, ')');
console.log('Removed', lines.length - newLines.length, 'lines');

// Verify imports and structure
const newContent = newLines.join('\n');
console.log('\nFirst 5 lines:');
newLines.slice(0, 5).forEach((l, i) => console.log(`  ${i+1}: ${l}`));

// Check key references still exist
const checks = [
  'restaurantDB',
  'OPTIONS',
  'LABELS',
  'SECTION_TITLES',
  'BUDGET_COMPAT',
  'QUICK_PRESETS',
  'extractBrand',
  'scoreRestaurant',
  'getLLMRecommendations',
  'export default function',
];
console.log('\nReference checks:');
checks.forEach(ref => {
  const found = newContent.includes(ref);
  console.log(`  ${found ? '✅' : '❌'} ${ref}`);
});

fs.writeFileSync('src/App.js', newContent);
console.log('\n✅ App.js updated successfully');
