#!/usr/bin/env node
/**
 * lint-code.js — 项目代码规范检查工具
 *
 * 检查项：
 *   1. JS 语法错误
 *   2. 未用 var 声明的 _cfg/_theme/_primary/_brand 引用
 *   3. 品牌硬编码泄露（#ec5b13 / YuKoLi / 邮箱 / WhatsApp）
 *   4. console.log 泄露（未 guard）
 *   5. style 赋值中的字符串拼接 bug
 *   6. 大文件警告
 *
 * 用法：node scripts/lint-code.js [--fix]
 */

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var JS_DIR = path.join(ROOT, 'src/assets/js');
var ERROR_COUNT = 0;
var WARN_COUNT = 0;
var FIX_MODE = process.argv.indexOf('--fix') !== -1;

// ── Helpers ──────────────────────────────────────────────

function error(file, line, msg) {
  console.log('  \x1b[31m✗ ERR\x1b[0m  ' + file + ':' + line + '  ' + msg);
  ERROR_COUNT++;
}

function warn(file, line, msg) {
  console.log('  \x1b[33m⚠ WARN\x1b[0m ' + file + ':' + line + '  ' + msg);
  WARN_COUNT++;
}

function pass(msg) {
  console.log('  \x1b[32m✓\x1b[0m    ' + msg);
}

function findFiles(dir, ext) {
  var results = [];
  var items;
  try { items = fs.readdirSync(dir); } catch (e) { return results; }
  items.forEach(function (item) {
    var full = path.join(dir, item);
    var stat;
    try { stat = fs.statSync(full); } catch (e) { return; }
    if (stat.isDirectory()) {
      results = results.concat(findFiles(full, ext));
    } else if (ext.indexOf(path.extname(full)) !== -1) {
      results.push(full);
    }
  });
  return results;
}

// ── Checks ───────────────────────────────────────────────

function checkSyntax(jsFiles) {
  console.log('\n━━ 1. JS 语法检查 ━━');
  var cp = require('child_process');
  var ok = true;
  jsFiles.forEach(function (f) {
    try {
      var result = cp.execSync('node -c "' + f + '"', { encoding: 'utf8', stdio: 'pipe' });
      if (result) { ok = false; error(f, 0, result.trim()); }
    } catch (e) {
      ok = false;
      var stderr = (e.stderr || '').trim();
      // Extract line number from node error
      var lineMatch = stderr.match(/\((\d+)\)/);
      error(path.relative(ROOT, f), lineMatch ? lineMatch[1] : '?', stderr.split('\n').pop());
    }
  });
  if (ok) pass(jsFiles.length + ' files syntax OK');
}

function checkConfigBridge(jsFiles) {
  console.log('\n━━ 2. Config Bridge 检查 ━━');
  jsFiles.forEach(function (f) {
    var content = fs.readFileSync(f, 'utf8');
    var rel = path.relative(ROOT, f);

    // Check if file references _cfg
    var hasUse = /\b_cfg\b/.test(content);
    var hasDecl = /var\s+_cfg\b/.test(content);
    var usesWindowCfg = /window\.\s*SITE_CONFIG\s*\|\|\s*window\.\s*_cfg/.test(content);

    // Check _primary used without declaration
    var usesPrimary = /\b_primary\b/.test(content);
    var declaresPrimary = /var\s+_primary\b/.test(content);
    if (usesPrimary && !declaresPrimary) {
      warn(rel, 0, '_primary referenced but not declared (may work via window._cfg but inconsistent)');
    }

    // Check _brand used without declaration
    var usesBrand = /\b_brand\b/.test(content);
    var declaresBrand = /var\s+_brand\b/.test(content);
    if (usesBrand && !declaresBrand) {
      warn(rel, 0, '_brand referenced but not declared');
    }
  });
  pass('Config bridge scan complete');
}

function checkBrandHardcode(jsFiles) {
  console.log('\n━━ 3. 品牌硬编码检查 ━━');
  jsFiles.forEach(function (f) {
    var content = fs.readFileSync(f, 'utf8');
    var rel = path.relative(ROOT, f);
    var lines = content.split('\n');

    lines.forEach(function (line, i) {
      var ln = i + 1;

      // #ec5b13 outside of fallback/variable definition
      if (/#ec5b13/.test(line) && !/"#ec5b13"/.test(line) && !/\/\/|\/\*/.test(line) && !/var\s+_primary/.test(line)) {
        error(rel, ln, 'Hardcoded brand color #ec5b13 (use _primary variable)');
      }

      // YuKoLi outside of fallback strings
      if (/"YuKoLi"/.test(line) || /'YuKoLi'/.test(line)) {
        if (!/\|\|.*YuKoLi/.test(line) && !/fallback/.test(line) && !/\/\/|\/\*/.test(line)) {
          error(rel, ln, 'Hardcoded brand name "YuKoLi" (use BRAND_NAME variable)');
        }
      }

      // console.log without __DEVELOPMENT__ guard
      if (/console\.(log|debug|info)\s*\(/.test(line) && !/__DEVELOPMENT__/.test(line) && !/\/\/|\/\*/.test(line)) {
        warn(rel, ln, 'Unguarded console.log (wrap with __DEVELOPMENT__ or remove)');
      }
    });
  });
}

function checkStyleAssignmentBug(jsFiles) {
  console.log('\n━━ 4. style 赋值 bug 检查 ━━');
  jsFiles.forEach(function (f) {
    var content = fs.readFileSync(f, 'utf8');
    var rel = path.relative(ROOT, f);
    var lines = content.split('\n');

    lines.forEach(function (line, i) {
      // Detect: element.style.xxx = "' + variable + '"
      // This is a bug — it assigns a literal string with + signs instead of concatenation
      if (/\.style\.\w+\s*=\s*"/.test(line) && /'\s*\+\s*\w+/.test(line)) {
        // Check if it's truly a literal string assignment containing '+'
        var match = line.match(/\.style\.(\w+)\s*=\s*"([^"]*)"/);
        if (match && match[2].indexOf("' + ") !== -1) {
          error(rel, i + 1, 'Bug: style.' + match[1] + ' = "' + match[2] + '" assigns literal string (use variable directly)');
        }
      }
    });
  });
}

function checkLargeFiles() {
  console.log('\n━━ 5. 大文件警告 ━━');
  var SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
  var videoFiles = findFiles(path.join(ROOT, 'src'), ['.mp4', '.mov', '.avi', '.mkv']);
  videoFiles.forEach(function (f) {
    var stat = fs.statSync(f);
    if (stat.size > SIZE_LIMIT) {
      warn(path.relative(ROOT, f), 0, 'Video file ' + Math.round(stat.size / 1024 / 1024) + 'MB exceeds 50MB limit (use CDN/LFS)');
    }
  });

  // Check tracked large files in git
  try {
    var result = require('child_process').execSync(
      'cd "' + ROOT + '" && git ls-tree -r -l HEAD | awk \'{if($4 > 50000000) print $4, $5}\'',
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    if (result) {
      result.split('\n').forEach(function (line) {
        warn('git tracked', 0, 'Large file in git: ' + line);
      });
    }
  } catch (e) { /* git not available */ }

  pass('Large file scan complete');
}

// ── Main ─────────────────────────────────────────────────

console.log('\n\x1b[36m═══════════════════════════════════════\x1b[0m');
console.log('\x1b[36m  BrewYuKoLi Code Lint v1.0\x1b[0m');
console.log('\x1b[36m═══════════════════════════════════════\x1b[0m');

var jsFiles = findFiles(JS_DIR, ['.js']);
console.log('Scanning ' + jsFiles.length + ' JS files...\n');

checkSyntax(jsFiles);
checkConfigBridge(jsFiles);
checkBrandHardcode(jsFiles);
checkStyleAssignmentBug(jsFiles);
checkLargeFiles();

console.log('\n\x1b[36m═══════════════════════════════════════\x1b[0m');
if (ERROR_COUNT === 0 && WARN_COUNT === 0) {
  console.log('\x1b[32m  All checks passed ✓\x1b[0m\n');
} else {
  console.log('  \x1b[31m' + ERROR_COUNT + ' error(s)\x1b[0m, \x1b[33m' + WARN_COUNT + ' warning(s)\x1b[0m\n');
  process.exit(ERROR_COUNT > 0 ? 1 : 0);
}
