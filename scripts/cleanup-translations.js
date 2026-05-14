#!/usr/bin/env node
/**
 * 翻译文件清理脚本
 * 
 * 用途: 从25种语言文件筛选出4个核心语言，减少Git存储压力
 * 保留语言: zh-CN (简体中文), en (英语), zh-TW (繁体中文), ja (日语)
 * 
 * 使用方法:
 *   node scripts/cleanup-translations.js [选项]
 * 
 * 选项:
 *   --dry-run     - 预览模式，不实际删除
 *   --keep-lang   - 保留指定语言 (逗号分隔)
 *   --backup      - 创建备份
 *   --restore     - 从备份恢复
 */

const fs = require('fs');
const path = require('path');

// 默认保留的核心语言
const CORE_LANGUAGES = ['zh-CN', 'en', 'zh-TW', 'ja'];

// 配置
const CONFIG = {
  langDir: path.join(__dirname, '../src/assets/lang'),
  backupDir: path.join(__dirname, '../temp/translations-backup'),
  logFile: path.join(__dirname, '../temp/translations-log.txt')
};

// 工具函数
const log = (message, verbose = true) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  if (verbose) {
    console.log(logMessage.trim());
  }
  
  // 写入日志文件
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage, 'utf8');
  } catch (e) {
    // 忽略日志文件写入错误
  }
};

// 创建备份
function createBackup() {
  const backupDir = CONFIG.backupDir;
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    log(`创建备份目录: ${backupDir}`);
  }
  
  const langFiles = fs.readdirSync(CONFIG.langDir);
  langFiles.forEach(file => {
    if (file.endsWith('-ui.json')) {
      const langCode = file.replace('-ui.json', '');
      const srcFile = path.join(CONFIG.langDir, file);
      const backupFile = path.join(backupDir, file);
      
      fs.copyFileSync(srcFile, backupFile);
      log(`备份: ${file} → ${backupFile}`);
    }
  });
}

// 恢复备份
function restoreBackup() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    log('错误: 备份目录不存在', false);
    return false;
  }
  
  const langFiles = fs.readdirSync(CONFIG.backupDir);
  langFiles.forEach(file => {
    if (file.endsWith('-ui.json')) {
      const srcFile = path.join(CONFIG.backupDir, file);
      const targetFile = path.join(CONFIG.langDir, file);
      
      fs.copyFileSync(srcFile, targetFile);
      log(`恢复: ${srcFile} → ${targetFile}`);
    }
  });
  
  return true;
}

// 获取所有语言文件
function getLanguageFiles() {
  if (!fs.existsSync(CONFIG.langDir)) {
    log('错误: 语言目录不存在', false);
    return [];
  }
  
  const files = fs.readdirSync(CONFIG.langDir);
  return files.filter(file => file.endsWith('-ui.json'));
}

// 获取语言信息
function getLanguageInfo(langFile) {
  const langCode = langFile.replace('-ui.json', '');
  const fullPath = path.join(CONFIG.langDir, langFile);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(content);
    
    return {
      code: langCode,
      name: langFile,
      size: content.length,
      fileCount: Object.keys(data).length,
      content: content,
      data: data
    };
  } catch (e) {
    log(`警告: 无法解析语言文件 ${langFile}: ${e.message}`, false);
    return null;
  }
}

// 筛选核心语言文件
function filterCoreLanguages(keepLanguages) {
  const allFiles = getLanguageFiles();
  const coreFiles = [];
  const otherFiles = [];
  
  allFiles.forEach(file => {
    const langCode = file.replace('-ui.json', '');
    if (keepLanguages.includes(langCode)) {
      coreFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  });
  
  return { coreFiles, otherFiles };
}

// 清理语言文件
function cleanupTranslations(keepLanguages, dryRun = false) {
  log('开始翻译文件清理...', true);
  log(`目标保留语言: ${keepLanguages.join(', ')}`, true);
  log(`模式: ${dryRun ? '预览' : '实际执行'}`, true);
  
  const { coreFiles, otherFiles } = filterCoreLanguages(keepLanguages);
  
  log(`核心语言文件: ${coreFiles.length}个`, true);
  coreFiles.forEach(file => {
    const info = getLanguageInfo(file);
    if (info) {
      log(`  ${info.name}: ${info.size}字节, ${info.fileCount}条翻译`, true);
    }
  });
  
  log(`需要删除的文件: ${otherFiles.length}个`, true);
  otherFiles.forEach(file => {
    const info = getLanguageInfo(file);
    if (info) {
      log(`  ${info.name}: ${info.size}字节, ${info.fileCount}条翻译`, true);
    }
  });
  
  if (dryRun) {
    log('预览模式完成，未实际删除任何文件', true);
    return;
  }
  
  // 实际删除文件
  let deletedCount = 0;
  let totalSize = 0;
  
  otherFiles.forEach(file => {
    const fullPath = path.join(CONFIG.langDir, file);
    const info = getLanguageInfo(file);
    
    try {
      fs.unlinkSync(fullPath);
      deletedCount++;
      totalSize += info ? info.size : 0;
      log(`删除: ${file}`, true);
    } catch (e) {
      log(`删除失败 ${file}: ${e.message}`, false);
    }
  });
  
  log(`清理完成！删除 ${deletedCount} 个文件，节省 ${totalSize} 字节`, true);
  
  // 更新lang-registry.js
  updateLangRegistry(keepLanguages);
}

// 更新lang-registry.js
function updateLangRegistry(keepLanguages) {
  const langRegistryPath = path.join(__dirname, '../src/assets/js/lang-registry.js');
  
  if (!fs.existsSync(langRegistryPath)) {
    log('警告: lang-registry.js 不存在', false);
    return;
  }
  
  try {
    const content = fs.readFileSync(langRegistryPath, 'utf8');
    
    // 创建新的fallback数组
    const newFallbackLanguages = [];
    
    // 解析现有fallback数据
    const fallbackMatch = content.match(/var _FALLBACK_LANGUAGES = \[(.*?)\];/s);
    if (fallbackMatch) {
      const fallbackStr = fallbackMatch[1];
      
      // 提取每个语言对象
      const langMatches = fallbackStr.match(/\{[^}]+\}/g);
      if (langMatches) {
        langMatches.forEach(langStr => {
          try {
            const langObj = eval(`(${langStr})`);
            if (keepLanguages.includes(langObj.code)) {
              newFallbackLanguages.push(langObj);
            }
          } catch (e) {
            log(`警告: 无法解析语言对象: ${langStr}`, false);
          }
        });
      }
    }
    
    // 更新文件内容
    const updatedContent = content.replace(
      /var _FALLBACK_LANGUAGES = \[.*?\];/s,
      `var _FALLBACK_LANGUAGES = ${JSON.stringify(newFallbackLanguages, null, 2)};`
    );
    
    // 写入更新后的文件
    fs.writeFileSync(langRegistryPath, updatedContent, 'utf8');
    log(`更新 lang-registry.js，保留 ${keepLanguages.length} 个语言`, true);
    
  } catch (e) {
    log(`更新lang-registry.js失败: ${e.message}`, false);
  }
}

// 计算节省空间
function calculateSavings(keepLanguages) {
  const { coreFiles, otherFiles } = filterCoreLanguages(keepLanguages);
  
  let coreSize = 0;
  let otherSize = 0;
  
  coreFiles.forEach(file => {
    const info = getLanguageInfo(file);
    if (info) coreSize += info.size;
  });
  
  otherFiles.forEach(file => {
    const info = getLanguageInfo(file);
    if (info) otherSize += info.size;
  });
  
  return {
    coreSize,
    otherSize,
    totalSize: coreSize + otherSize,
    savings: otherSize,
    percentage: ((otherSize / (coreSize + otherSize)) * 100).toFixed(2)
  };
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const backup = args.includes('--backup');
  const restore = args.includes('--restore');
  const keepLangArg = args.find(arg => arg.startsWith('--keep-lang='));
  
  let keepLanguages = CORE_LANGUAGES;
  
  if (keepLangArg) {
    keepLanguages = keepLangArg.replace('--keep-lang=', '').split(',').map(lang => lang.trim());
    log(`自定义保留语言: ${keepLanguages.join(', ')}`, true);
  }
  
  // 创建临时目录
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  if (backup) {
    log('创建翻译文件备份...', true);
    createBackup();
    return;
  }
  
  if (restore) {
    log('从备份恢复翻译文件...', true);
    if (restoreBackup()) {
      log('恢复完成', true);
    }
    return;
  }
  
  if (dryRun) {
    log('=== 预览模式 ===', true);
    const savings = calculateSavings(keepLanguages);
    log(`预计节省: ${savings.savings}字节 (${savings.percentage}%)`, true);
  }
  
  cleanupTranslations(keepLanguages, dryRun);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  cleanupTranslations,
  createBackup,
  restoreBackup,
  calculateSavings,
  CORE_LANGUAGES
};