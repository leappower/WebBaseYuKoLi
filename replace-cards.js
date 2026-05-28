const fs = require('fs');

const BASE = '/Users/chee/Projects/BrewYuKoLi/src/pages/solutions';

// PC version - replace gradient blocks with img blocks
const pcContent = fs.readFileSync(`${BASE}/index-pc.html`, 'utf8');

// Indentation: 14 spaces before div, 16 before span
const INDENT1 = '              ';  // 14 spaces
const INDENT2 = '                '; // 16 spaces

const pcReplacements = [
  {
    old: `${INDENT1}<div class="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-6xl text-white/90">precision_manufacturing</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-48 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-oem.webp" alt="OEM Custom Manufacturing" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-6xl text-white/90">design_services</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-48 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-odm.webp" alt="ODM Private Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-6xl text-white/90">verified</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-48 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-obm.webp" alt="OBM Own Brand" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-48 bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-6xl text-white/90">science</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-48 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-rd.webp" alt="R&D and Flavor Lab" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-48 bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-6xl text-white/90">inventory</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-48 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-packaging.webp" alt="Packaging and Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  }
];

let result = pcContent;
let replacedCount = 0;
for (const { old, new: newText } of pcReplacements) {
  const count = (result.match(old) || []).length;
  result = result.replace(old, newText);
  replacedCount += count;
}
fs.writeFileSync(`${BASE}/index-pc.html`, result, 'utf8');
console.log(`PC cards: ${replacedCount} replacements done`);

// Tablet version (uses h-36 and text-5xl instead of h-48 and text-6xl)
const tbContent = fs.readFileSync(`${BASE}/index-tablet.html`, 'utf8');

const tbReplacements = [
  {
    old: `${INDENT1}<div class="h-36 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-5xl text-white/90">precision_manufacturing</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-36 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-oem.webp" alt="OEM Custom Manufacturing" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-36 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-5xl text-white/90">design_services</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-36 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-odm.webp" alt="ODM Private Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-36 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-5xl text-white/90">verified</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-36 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-obm.webp" alt="OBM Own Brand" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-36 bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-5xl text-white/90">science</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-36 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-rd.webp" alt="R&D and Flavor Lab" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  },
  {
    old: `${INDENT1}<div class="h-36 bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
${INDENT2}<span class="material-symbols-outlined text-5xl text-white/90">inventory</span>
${INDENT1}</div>`,
    new: `${INDENT1}<div class="h-36 relative overflow-hidden">
${INDENT2}<img src="/assets/images/oem/solutions/card-packaging.webp" alt="Packaging and Labeling" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
${INDENT1}</div>`
  }
];

let tbResult = tbContent;
let tbReplaced = 0;
for (const { old, new: newText } of tbReplacements) {
  const count = (tbResult.match(old) || []).length;
  tbResult = tbResult.replace(old, newText);
  tbReplaced += count;
}
fs.writeFileSync(`${BASE}/index-tablet.html`, tbResult, 'utf8');
console.log(`Tablet cards: ${tbReplaced} replacements done`);

// Mobile version - list style layout, no gradient image blocks to replace
// Just verify
console.log('Mobile cards: list-style layout, no image blocks to replace (keeping small icons)');
console.log('Task 3 complete');
