#!/usr/bin/env node
/**
 * fix-critical-cascade.js — 自动补齐 critical.css 中缺失的响应式 @media 覆盖
 *
 * 问题:
 *   critical-css 通过 <style> 内联到 HTML <head> 中（在 </head> 前），
 *   而 tailwind.css 通过 <link rel="stylesheet"> 加载（在 <head> 较前位置）。
 *   CSS cascade 按文档顺序决定同 specificity 规则的优先级，
 *   因此 critical-css 中的全局规则（如 .flex-col）会覆盖 tailwind.css 中
 *   @media 内的同属性规则（如 @media { .lg\:flex-row }）。
 *
 * 方案:
 *   1. 从 tailwind.css 提取所有 @media 内的单类选择器规则
 *   2. 对于设置了"布局属性"的规则（flex-direction, grid-template-columns,
 *      display, width, gap, padding, margin, font-size 等），
 *      检查 critical.css 中是否有同属性的基础规则可能覆盖它
 *   3. 将所有可能被覆盖的 @media 规则追加到 critical.css 的 @media 块中
 *
 * 更简化的策略:
 *   直接从 tailwind.css 提取所有 @media 块，过滤出与 critical.css
 *   基础类共享相同 CSS 属性的响应式变体。
 *
 * 用法: node scripts/fix-critical-cascade.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..');
const CRITICAL_PATH = path.join(SRC_DIR, 'src/assets/css/critical.css');
const TAILWIND_PATH = path.join(SRC_DIR, 'src/assets/css/tailwind.css');

// 需要保护的 CSS 属性（这些属性如果出现在全局规则中，会覆盖 @media 同属性）
const PROTECTED_PROPERTIES = new Set([
  'flex-direction',
  'display',
  'flex',
  'grid-template-columns',
  'width',
  'height',
  'gap',
  'column-gap',
  'row-gap',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'font-size',
  'line-height',
  'font-weight',
  'text-align',
  'align-items',
  'justify-content',
  'flex-wrap',
  'flex-shrink',
  'flex-grow',
  'border-radius',
  'box-shadow',
  'opacity',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'overflow',
  'max-width',
  'min-width',
]);

/**
 * 从 CSS 声明文本中提取受保护的属性名
 */
function extractProperties(cssDecl) {
  const props = new Set();
  // 去掉 { } 之间的外部内容
  const braceStart = cssDecl.indexOf('{');
  const braceEnd = cssDecl.lastIndexOf('}');
  const content = (braceStart >= 0 && braceEnd > braceStart)
    ? cssDecl.substring(braceStart + 1, braceEnd)
    : cssDecl;
  const parts = content.split(';');
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx >= 0) {
      const propName = part.substring(0, colonIdx).trim().replace(/^--tw-/, '');
      if (PROTECTED_PROPERTIES.has(propName)) {
        props.add(propName);
      }
    }
  }
  return props;
}

/**
 * 从 critical.css 中提取基础类的受保护属性
 * 返回: Map<propertyName, Set<className>>
 */
function extractCriticalBaseProperties(css) {
  const propMap = new Map(); // property -> Set<className>
  const lines = css.split('\n');
  let inMedia = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (/@media\s/i.test(line)) inMedia = true;
    if (inMedia && /^}\s*$/.test(line)) inMedia = false;
    if (!inMedia) {
      const m = line.match(/^\.([a-z][a-z0-9_-]*(?:\/[a-z0-9_-]+)?)\s*\{/);
      if (m) {
        const cls = m[1];
        let decl = '';
        for (let j = lineIdx; j < lines.length; j++) {
          decl += lines[j] + '\n';
          if (j > lineIdx && /^}\s*$/.test(lines[j])) break;
        }
        const props = extractProperties(decl);
        for (const p of props) {
          if (!propMap.has(p)) propMap.set(p, new Set());
          propMap.get(p).add(cls);
        }
      }
    }
  }
  return propMap;
}

/**
 * 从 tailwind.css 的 @media 块中提取所有单类选择器规则
 * 返回: Array<{ mediaQuery, className, properties, fullRule }>
 */
function extractTailwindMediaRules(tw) {
  const rules = [];
  // 找所有 @media 块，按位置排序确保处理顺序正确
  const mediaRe = /@media\s*\([^)]+\)\s*\{/g;
  const allMatches = [];
  let match;

  while ((match = mediaRe.exec(tw)) !== null) {
    allMatches.push({ index: match.index, match: match[0] });
  }

  for (const { index: mi, match: mm } of allMatches) {
    const mediaQuery = tw.substring(mi + 7, mi + mm.length - 1).trim();
    // 找这个 @media 块的内容
    const blockStart = mi + mm.length;
    let depth = 1;
    let pos = blockStart;
    while (pos < tw.length && depth > 0) {
      if (tw[pos] === '{') depth++;
      if (tw[pos] === '}') depth--;
      if (depth === 0) break;
      pos++;
    }
    const blockContent = tw.substring(blockStart, pos);

    // 在块内容中提取单类选择器规则
    // Pattern: .prefix\:class-name{props} 或 .class-name{props}
    const ruleRe = /\.([a-z0-9_-]+(?:\\:[a-z0-9_-]+)*(?:\/[a-z0-9_-]+)?)\{([^}]*)\}/g;
    let ruleMatch;
    while ((ruleMatch = ruleRe.exec(blockContent)) !== null) {
      const selector = ruleMatch[1];
      const props = ruleMatch[2];
      // 解码转义: .lg\:flex-row -> lg:flex-row
      const className = selector.replace(/\\:/g, ':');
      rules.push({
        mediaQuery,
        className,
        properties: props,
        fullRule: ruleMatch[0],
      });
    }
  }

  return rules;
}

/**
 * 检查 critical.css 中已有的 @media 覆盖
 */
function findExistingOverrides(css) {
  const existing = new Set();
  const re = /\.([a-z0-9_-]+)\\:([a-z0-9_-]+(?:\/[a-z0-9_-]+)?)\s*\{/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    existing.add(`${m[1]}:${m[2]}`);
  }
  return existing;
}

// ─── Main ─────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(CRITICAL_PATH)) {
    console.log('  ⏭️  critical.css not found, skipping');
    process.exit(0);
  }
  if (!fs.existsSync(TAILWIND_PATH)) {
    console.log('  ⏭️  tailwind.css not found, skipping');
    process.exit(0);
  }

  let critical = fs.readFileSync(CRITICAL_PATH, 'utf-8');
  const tailwind = fs.readFileSync(TAILWIND_PATH, 'utf-8');

  // 0. 移除之前的自动生成块（先删除，再扫描 existing）
  const marker = '/* ═══════════════════════════════════════════════════════════════';
  const markerIdx = critical.lastIndexOf(marker);
  if (markerIdx >= 0) {
    critical = critical.substring(0, markerIdx).trimEnd();
  }

  // 1. 提取 critical.css 基础类的属性
  const criticalProps = extractCriticalBaseProperties(critical);

  // 2. 提取 tailwind.css 的 @media 规则
  const twRules = extractTailwindMediaRules(tailwind);

  // 3. 找出需要保护的 @media 规则（在 marker 删除后扫描）
  const existing = findExistingOverrides(critical);

  // 按 media query 分组
  const byMedia = new Map();
  let added = 0;

  for (const rule of twRules) {
    const props = extractProperties(rule.properties);
    // 检查是否有任何受保护的属性
    const hasProtected = [...props].some(p => criticalProps.has(p));
    if (!hasProtected) continue;

    // 检查是否已存在于 critical.css
    const unescaped = rule.className.replace(/\\:/g, ':');
    const parts = unescaped.split(':');
    const existingKey = parts.length > 1 ? `${parts[0]}:${parts[1]}` : null;
    if (existingKey && existing.has(existingKey)) continue;

    if (!byMedia.has(rule.mediaQuery)) byMedia.set(rule.mediaQuery, []);
    byMedia.get(rule.mediaQuery).push(rule);
    added++;
  }

  if (added === 0) {
    console.log('  ✅ fix-critical-cascade: all responsive overrides up to date');
    return;
  }

  // 4. 生成 @media 块并追加
  const BP_ORDER = ['640', '768', '1024', '1280'];
  const sortedMedia = [...byMedia.keys()].sort((a, b) => {
    const numA = a.match(/(\d+)px/)?.[1] || '0';
    const numB = b.match(/(\d+)px/)?.[1] || '0';
    return parseInt(numA) - parseInt(numB);
  });

  const lines = [
    '',
    '/* ═══════════════════════════════════════════════════════════════',
    ' * Responsive overrides — auto-generated by fix-critical-cascade.js',
    ' * DO NOT EDIT — re-run build to regenerate.',
    ' * ═══════════════════════════════════════════════════════════════ */',
  ];

  for (const mq of sortedMedia) {
    lines.push(`@media (${mq}) {`);
    for (const rule of byMedia.get(mq)) {
      // 使用原始 CSS 选择器（带转义）
      lines.push(`  ${rule.fullRule}`);
    }
    lines.push('}');
    lines.push('');
  }

  critical += '\n' + lines.join('\n');

  fs.writeFileSync(CRITICAL_PATH, critical, 'utf-8');
  console.log(`  ✅ fix-critical-cascade: added ${added} responsive rules across ${sortedMedia.length} breakpoints`);
}

main();
