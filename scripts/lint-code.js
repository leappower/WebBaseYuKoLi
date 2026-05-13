#!/usr/bin/env node
/**
 * lint-code.js — 项目代码规范自动检查工具 v2.1
 *
 * 配套规范：docs/DEV-STANDARDS.md（第 10 章：代码搜索与批量替换规范）
 *
 * 检查项（12 项）：
 *   1.  JS 语法检查
 *   2.  JSON 格式检查
 *   3.  HTML 标签闭合检查
 *   4.  Config Bridge 一致性
 *   5.  品牌硬编码泄露
 *   6.  console.log 泄露
 *   7.  style 赋值字符串拼接 bug
 *   8.  大文件检查
 *   9.  'use strict' 缺失
 *   10. ES6+ 语法检测
 *   11. 未 guard 的 JSON.parse / fetch
 *   12. 硬编码 URL (社交链接等)
 *
 * 用法：
 *   node scripts/lint-code.js              # 检查所有文件
 *   node scripts/lint-code.js --staged     # 只检查 staged 文件
 *   node scripts/lint-code.js --fix        # 自动修复可修复的问题
 *
 * 退出码：
 *   0 = 全部通过
 *   1 = 有错误
 *   2 = 有警告
 */

'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var JS_DIR = path.join(ROOT, 'src/assets/js');
var PAGES_DIR = path.join(ROOT, 'src/pages');
var LANG_DIR = path.join(ROOT, 'src/assets/lang');
var ERROR_COUNT = 0;
var WARN_COUNT = 0;
var FIX_COUNT = 0;
var STAGED_ONLY = process.argv.indexOf('--staged') !== -1;
var FIX_MODE = process.argv.indexOf('--fix') !== -1;
var EXCLUDE_DIRS = ['node_modules', 'dist', '.git', 'vendor', 'scripts'];

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function error(file, line, msg) {
  console.log('  \x1b[31m✗ ERR\x1b[0m  ' + file + (line ? ':' + line : '') + '  ' + msg);
  ERROR_COUNT++;
}

function warn(file, line, msg) {
  console.log('  \x1b[33m⚠ WARN\x1b[0m ' + file + (line ? ':' + line : '') + '  ' + msg);
  WARN_COUNT++;
}

function info(msg) {
  console.log('  \x1b[36mℹ INFO\x1b[0m ' + msg);
}

function pass(msg) {
  console.log('  \x1b[32m✓\x1b[0m    ' + msg);
}

function fix(msg) {
  console.log('  \x1b[34m⟳ FIX\x1b[0m  ' + msg);
  FIX_COUNT++;
}

function rel(f) {
  return path.relative(ROOT, f);
}

function findFiles(dir, exts) {
  var results = [];
  try { walk(dir, exts, results); } catch (e) {}
  return results;
}

function walk(dir, exts, results) {
  var items = fs.readdirSync(dir);
  items.forEach(function (item) {
    var full = path.join(dir, item);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'vendor'].indexOf(item) !== -1) return;
      walk(full, exts, results);
    } else if (exts.indexOf(path.extname(full)) !== -1) {
      results.push(full);
    }
  });
}

function getStagedFiles() {
  try {
    var output = cp.execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: ROOT, encoding: 'utf8', stdio: 'pipe'
    }).trim();
    return output ? output.split('\n') : [];
  } catch (e) {
    return [];
  }
}

function readLines(f) {
  try { return fs.readFileSync(f, 'utf8').split('\n'); }
  catch (e) { return []; }
}

// ═══════════════════════════════════════════════════════════
// Check 1: JS Syntax
// ═══════════════════════════════════════════════════════════

function checkJSSyntax(jsFiles) {
  console.log('\n\x1b[1m━━ 1/12  JS 语法检查 (node -c) ━━\x1b[0m');
  var ok = true;
  jsFiles.forEach(function (f) {
    try {
      cp.execSync('node -c "' + f + '"', { encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      ok = false;
      var stderr = (e.stderr || '').trim();
      var lineMatch = stderr.match(/\((\d+)\)/);
      error(rel(f), lineMatch ? lineMatch[1] : '?', stderr.split('\n').pop());
    }
  });
  if (ok) pass(jsFiles.length + ' files syntax OK');
}

// ═══════════════════════════════════════════════════════════
// Check 2: JSON Format
// ═══════════════════════════════════════════════════════════

function checkJSONFormat(jsonFiles) {
  console.log('\n\x1b[1m━━ 2/12  JSON 格式检查 ━━\x1b[0m');
  var ok = true;
  jsonFiles.forEach(function (f) {
    try {
      JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch (e) {
      ok = false;
      var lineMatch = (e.message || '').match(/position (\d+)/);
      error(rel(f), lineMatch ? '?' : '?', 'Invalid JSON: ' + e.message.split('\n')[0]);
    }
  });
  if (ok) pass(jsonFiles.length + ' JSON files valid');
}

// ═══════════════════════════════════════════════════════════
// Check 3: HTML Tag Closure
// ═══════════════════════════════════════════════════════════

function checkHTMLTags(htmlFiles) {
  console.log('\n\x1b[1m━━ 3/12  HTML 标签闭合检查 ━━\x1b[0m');
  var VOID_ELEMENTS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                        'link', 'meta', 'param', 'source', 'track', 'wbr'];
  var issues = 0;
  var maxReport = 10;

  htmlFiles.forEach(function (f) {
    var lines = readLines(f);
    lines.forEach(function (line, i) {
      VOID_ELEMENTS.forEach(function (tag) {
        // Match <tag ... > that doesn't end with />
        var re = new RegExp('<' + tag + '\\b[^>]*(?<!/)>', 'i');
        if (re.test(line) && !/<[^>]*\/\s*>/.test(line.split('<' + tag)[0].slice(-1) + '<' + tag + line.split('<' + tag)[1])) {
          // More precise: check if the tag specifically is self-closed
          var specific = new RegExp('<' + tag + '\\b[^>]*[^/]>', 'i');
          var selfClosed = new RegExp('<' + tag + '\\b[^>]*/\\s*>', 'i');
          if (specific.test(line) && !selfClosed.test(line)) {
            issues++;
            if (issues <= maxReport) {
              warn(rel(f), i + 1, 'Void element <' + tag + '> not self-closed (add />)');
            }
          }
        }
      });
    });
  });

  if (issues === 0) {
    pass(htmlFiles.length + ' HTML files checked');
  } else {
    warn('', 0, 'Total: ' + issues + ' unclosed void elements' + (issues > maxReport ? ' (showing first ' + maxReport + ')' : ''));
  }
}

// ═══════════════════════════════════════════════════════════
// Check 4: Config Bridge Consistency
// ═══════════════════════════════════════════════════════════

function checkConfigBridge(jsFiles) {
  console.log('\n\x1b[1m━━ 4/12  Config Bridge 一致性 ━━\x1b[0m');
  jsFiles.forEach(function (f) {
    var content = fs.readFileSync(f, 'utf8');
    var r = rel(f);

    // _primary used without declaration
    if (/\b_primary\b/.test(content) && !/var\s+_primary\b/.test(content)) {
      warn(r, 0, '_primary referenced but not declared (declare via _colors.primary)');
    }

    // _brand used without declaration
    if (/\b_brand\b/.test(content) && !/var\s+_brand\b/.test(content)) {
      warn(r, 0, '_brand referenced but not declared (declare via _cfg.brand)');
    }

    // _cfg used without declaration or window._cfg fallback
    if (/\b_cfg\b/.test(content) && !/var\s+_cfg\b/.test(content) && !/window\._cfg/.test(content) && !/site\.config\.js$/.test(f)) {
      error(r, 0, '_cfg used but neither declared nor imported from window._cfg');
    }

    // window.SITE_CONFIG assignment detection (skip site.config.js itself)
    if (/window\.SITE_CONFIG\s*=/.test(content) && !/site\.config\.js$/.test(f)) {
      error(r, 0, 'window.SITE_CONFIG is assigned (read-only, defined in site.config.js)');
    }
  });
}

// ═══════════════════════════════════════════════════════════
// Check 5: Brand Hardcoded Values
// ═══════════════════════════════════════════════════════════

function checkBrandHardcode(jsFiles) {
  console.log('\n\x1b[1m━━ 5/12  品牌硬编码检查 ━━\x1b[0m');
  jsFiles.forEach(function (f) {
    var lines = readLines(f);
    var r = rel(f);

    lines.forEach(function (line, i) {
      var ln = i + 1;
      var trimmed = line.trim();

      // Skip site.config.js — this IS the config source
      if (/site\.config\.js$/.test(f)) return;
      // Skip comments
      if (/^\s*(\/\/|\/\*|\*)/.test(trimmed)) return;
      // Skip var _primary definition line (has fallback)
      if (/var\s+_primary/.test(line)) return;
      // Skip fallback patterns (|| "#ec5b13" or || "YuKoLi")
      if (/\|\|.*#ec5b13/.test(line)) return;
      if (/\|\|.*YuKoLi/.test(line)) return;
      if (/fallback/.test(line)) return;

      // #ec5b13
      if (/#ec5b13/.test(line)) {
        error(r, ln, 'Hardcoded brand color #ec5b13 (use _primary variable)');
      }

      // #d4521a (hover color)
      if (/#d4521a/.test(line)) {
        error(r, ln, 'Hardcoded brand hover color #d4521a (derive from _primary)');
      }

      // "YuKoLi" or 'YuKoLi'
      if (/(["'])YuKoLi\1/.test(line)) {
        error(r, ln, 'Hardcoded brand name "YuKoLi" (use BRAND_NAME variable)');
      }

      // Hardcoded WhatsApp number
      if (/8613163756465/.test(line) && !/\|\|/.test(line)) {
        warn(r, ln, 'Hardcoded WhatsApp number without fallback chain');
      }

      // Hardcoded email
      if (/support@yukoli\.com|info@yukoli\.com/.test(line) && !/\|\|/.test(line) && !/_cfg/.test(line)) {
        warn(r, ln, 'Hardcoded email without config fallback');
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Check 6: console.log Leak
// ═══════════════════════════════════════════════════════════

function checkConsoleLog(jsFiles) {
  console.log('\n\x1b[1m━━ 6/12  console.log 泄露检查 ━━\x1b[0m');
  jsFiles.forEach(function (f) {
    var lines = readLines(f);
    var r = rel(f);

    lines.forEach(function (line, i) {
      var trimmed = line.trim();
      if (/^\s*(\/\/|\/\*|\*)/.test(trimmed)) return;

      if (/console\.(log|debug|info|warn|error)\s*\(/.test(line)) {
        if (!/__DEVELOPMENT__|__DEV__|DEBUG/.test(line)) {
          // Check if it's in a comment on the same line
          if (/\/\/.*console/.test(line) && line.indexOf('//') < line.indexOf('console')) return;
          warn(r, i + 1, 'Unguarded console.' + line.match(/console\.(\w+)/)[1] + ' (wrap with if (__DEVELOPMENT__) or remove)');
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Check 7: style Assignment String Concat Bug
// ═══════════════════════════════════════════════════════════

function checkStyleAssignmentBug(jsFiles) {
  console.log('\n\x1b[1m━━ 7/12  style 赋值 Bug 检查 ━━\x1b[0m');
  jsFiles.forEach(function (f) {
    var lines = readLines(f);
    var r = rel(f);

    lines.forEach(function (line, i) {
      // Detect: element.style.xxx = "' + variable + '"
      // This assigns a literal string "' + variable + '" instead of the variable value
      var match = line.match(/\.style\.(\w+)\s*=\s*"([^"]*)"/);
      if (match && match[2].indexOf("' + ") !== -1) {
        error(r, i + 1, 'Bug: style.' + match[1] + ' assigns literal "' + match[2] + '" (use variable directly: element.style.' + match[1] + ' = variable)');
      }
      // Also check single quotes
      match = line.match(/\.style\.(\w+)\s*=\s*'([^']*)'/);
      if (match && match[2].indexOf('" + ') !== -1) {
        error(r, i + 1, 'Bug: style.' + match[1] + ' assigns literal (use variable directly)');
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Check 8: Large Files
// ═══════════════════════════════════════════════════════════

function checkLargeFiles() {
  console.log('\n\x1b[1m━━ 8/12  大文件检查 (>50MB) ━━\x1b[0m');
  var SIZE_LIMIT = 50 * 1024 * 1024;

  // Check local files
  var videoFiles = findFiles(path.join(ROOT, 'src'), ['.mp4', '.mov', '.avi', '.mkv']);
  videoFiles.forEach(function (f) {
    try {
      var stat = fs.statSync(f);
      if (stat.size > SIZE_LIMIT) {
        warn(rel(f), 0, Math.round(stat.size / 1024 / 1024) + 'MB exceeds 50MB limit (use CDN or Git LFS)');
      }
    } catch (e) {}
  });

  // Check git tracked files
  try {
    var result = cp.execSync(
      'cd "' + ROOT + '" && git ls-tree -r -l HEAD | awk \'{if($4 > 50000000) print $5, $4}\' 2>/dev/null',
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    if (result) {
      result.split('\n').forEach(function (line) {
        var parts = line.split(' ');
        error('git tracked', 0, 'Large file in git: ' + parts[0] + ' (' + Math.round(parseInt(parts[1]) / 1024 / 1024) + 'MB) — use git-lfs or move to CDN');
      });
    }
  } catch (e) {}

  pass('Large file scan complete');
}

// ═══════════════════════════════════════════════════════════
// Check 9: 'use strict' Missing
// ═══════════════════════════════════════════════════════════

function checkUseStrict(jsFiles) {
  console.log('\n\x1b[1m━━ 9/12  \x27use strict\x27 检查 ━━\x1b[0m');
  jsFiles.forEach(function (f) {
    var content = fs.readFileSync(f, 'utf8');
    if (!/'use strict'/.test(content) && !/"use strict"/.test(content)) {
      error(rel(f), 0, "Missing 'use strict' directive");
    }
  });
}

// ═══════════════════════════════════════════════════════════
// Check 10: ES6+ Syntax Detection
// ═══════════════════════════════════════════════════════════

function checkES6Syntax(jsFiles) {
  console.log('\n\x1b[1m━━ 10/12 ES6+ 语法检测（项目要求 ES5） ━━\x1b[0m');
  var patterns = [
    { re: /\bconst\s+\w+\s*=/, name: 'const' },
    { re: /\blet\s+\w+\s*=/, name: 'let' },
    { re: /=>\s*[{(]/, name: 'arrow function' },
    { re: /`[^`]*\$\{/, name: 'template literal' },
    { re: /\.\.\.(\w+|[{[])/, name: 'spread operator' },
    { re: /class\s+\w+(\s+extends)?\s*\{/, name: 'class keyword' },
    { re: /import\s+.*from\s+/, name: 'import statement' },
    { re: /export\s+(default\s+)?/, name: 'export statement' },
    { re: /Object\.assign\(/, name: 'Object.assign (ES6)' },
    { re: /Array\.includes\(/, name: 'Array.includes (ES2016)' },
  ];

  jsFiles.forEach(function (f) {
    var lines = readLines(f);
    var r = rel(f);

    lines.forEach(function (line, i) {
      var trimmed = line.trim();
      if (/^\s*(\/\/|\/\*|\*)/.test(trimmed)) return;

      patterns.forEach(function (p) {
        if (p.re.test(line)) {
          error(r, i + 1, 'ES6+ syntax detected: ' + p.name + ' (project requires ES5)');
        }
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Check 11: Unguarded JSON.parse / fetch
// ═══════════════════════════════════════════════════════════

function checkUnguardedOperations(jsFiles) {
  console.log('\n\x1b[1m━━ 11/12 未 guard 的 JSON.parse / fetch ━━\x1b[0m');
  jsFiles.forEach(function (f) {
    var content = fs.readFileSync(f, 'utf8');
    var lines = content.split('\n');
    var r = rel(f);

    // Find JSON.parse calls and check if they're in a try block
    lines.forEach(function (line, i) {
      if (/JSON\.parse\s*\(/.test(line) && !/^\s*(\/\/|\/\*|\*)/.test(line.trim())) {
        // Check if there's a try in the surrounding 5 lines
        var surrounding = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
        if (!/\btry\s*\{/.test(surrounding)) {
          warn(r, i + 1, 'JSON.parse without try/catch');
        }
      }
    });

    // Find fetch calls without .catch
    lines.forEach(function (line, i) {
      if (/\bfetch\s*\(/.test(line) && !/^\s*(\/\/|\/\*|\*)/.test(line.trim())) {
        // Look ahead 5 lines for .catch or try
        var ahead = lines.slice(i, Math.min(lines.length, i + 6)).join('\n');
        if (!/\.catch\s*\(/.test(ahead) && !/\btry\s*\{/.test(ahead)) {
          warn(r, i + 1, 'fetch without .catch or try/catch');
        }
      }
    });

    // Find localStorage/sessionStorage without try/catch
    lines.forEach(function (line, i) {
      if (/\b(localStorage|sessionStorage)\.\w+/.test(line) && !/^\s*(\/\/|\/\*|\*)/.test(line.trim())) {
        var surrounding = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
        if (!/\btry\s*\{/.test(surrounding)) {
          warn(r, i + 1, 'localStorage/sessionStorage access without try/catch (may throw in private mode)');
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Check 12: Hardcoded URLs (social links etc.)
// ═══════════════════════════════════════════════════════════

function checkHardcodedURLs(jsFiles) {
  console.log('\n\x1b[1m━━ 12/12 硬编码 URL 检查 ━━\x1b[0m');
  var whitelist = [
    'yukoli.com', 'kitchen.yukoli.com',
    'googleapis.com', 'maps.googleapis.com', 'maps.gstatic.com',
    'fonts.googleapis.com', 'fonts.gstatic.com',
    'wa.me', 'api.whatsapp.com',
    'schema.org', 'w3.org',
    'youtube.com', 'youtu.be',
    'github.com', 'github.io',
  ];

  jsFiles.forEach(function (f) {
    var lines = readLines(f);
    var r = rel(f);

    lines.forEach(function (line, i) {
      var trimmed = line.trim();
      if (/^\s*(\/\/|\/\*|\*)/.test(trimmed)) return;

      var urlMatch = line.match(/https?:\/\/[^\s"')]+/);
      if (urlMatch) {
        var url = urlMatch[0];
        var isWhitelisted = whitelist.some(function (w) { return url.indexOf(w) !== -1; });
        if (!isWhitelisted) {
          warn(r, i + 1, 'Hardcoded URL (should be in site.config.js): ' + url);
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════

console.log('\n\x1b[36m═══════════════════════════════════════════\x1b[0m');
console.log('\x1b[36m  BrewYuKoLi Code Lint v2.0\x1b[0m');
console.log('\x1b[36m  ' + new Date().toISOString() + '\x1b[0m');
if (STAGED_ONLY) console.log('\x1b[36m  Mode: --staged (only git staged files)\x1b[0m');
if (FIX_MODE) console.log('\x1b[36m  Mode: --fix (auto-fix where possible)\x1b[0m');
console.log('\x1b[36m═══════════════════════════════════════════\x1b[0m');

// Collect files
var jsFiles, htmlFiles, jsonFiles;

if (STAGED_ONLY) {
  var staged = getStagedFiles();
  jsFiles = staged.filter(function (f) {
    return f.endsWith('.js') && !EXCLUDE_DIRS.some(function (d) { return f.indexOf(d + '/') === 0; });
  }).map(function (f) { return path.join(ROOT, f); }).filter(function (f) { return fs.existsSync(f); });
  htmlFiles = staged.filter(function (f) { return f.endsWith('.html'); }).map(function (f) { return path.join(ROOT, f); }).filter(function (f) { return fs.existsSync(f); });
  jsonFiles = staged.filter(function (f) { return f.endsWith('.json'); }).map(function (f) { return path.join(ROOT, f); }).filter(function (f) { return fs.existsSync(f); });
} else {
  jsFiles = findFiles(JS_DIR, ['.js']);
  htmlFiles = findFiles(PAGES_DIR, ['.html']);
  jsonFiles = findFiles(LANG_DIR, ['.json']);
}

console.log('\nFiles: ' + jsFiles.length + ' JS, ' + htmlFiles.length + ' HTML, ' + jsonFiles.length + ' JSON');

checkJSSyntax(jsFiles);
checkJSONFormat(jsonFiles);
checkHTMLTags(htmlFiles);
checkConfigBridge(jsFiles);
checkBrandHardcode(jsFiles);
checkConsoleLog(jsFiles);
checkStyleAssignmentBug(jsFiles);
checkLargeFiles();
checkUseStrict(jsFiles);
checkES6Syntax(jsFiles);
checkUnguardedOperations(jsFiles);
checkHardcodedURLs(jsFiles);

console.log('\n\x1b[36m═══════════════════════════════════════════\x1b[0m');
if (ERROR_COUNT === 0 && WARN_COUNT === 0) {
  console.log('\x1b[32m  ✅ All 12 checks passed — ' + jsFiles.length + ' JS + ' + htmlFiles.length + ' HTML + ' + jsonFiles.length + ' JSON\x1b[0m\n');
} else {
  console.log('  \x1b[31m' + ERROR_COUNT + ' error(s)\x1b[0m  \x1b[33m' + WARN_COUNT + ' warning(s)\x1b[0m');
  if (FIX_COUNT > 0) console.log('  \x1b[34m' + FIX_COUNT + ' auto-fixed\x1b[0m');
  console.log();
  process.exit(ERROR_COUNT > 0 ? 1 : 2);
}
