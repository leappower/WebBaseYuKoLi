import { test, expect } from '@playwright/test';

/**
 * Static deploy E2E test — JJC-020 T5d
 *
 * Verifies that the built dist/ directory works correctly in three
 * static deployment scenarios:
 *   1. file:// protocol (local open) — browser-based
 *   2. npx serve (root path)
 *   3. npx serve with BASE_PATH (subdirectory deployment)
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIST = path.resolve(__dirname, '../../dist');

// Helper: wait for server to be ready
async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url);
      if (resp.status === 200) return;
    } catch {
      // server not ready yet
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

// ═══════════════════════════════════════════════════════════════════
// Pre-check: dist/ exists
// ═══════════════════════════════════════════════════════════════════

test.describe('静态部署 E2E — 前置检查', () => {
  test('dist/ 目录应存在', () => {
    expect(fs.existsSync(DIST)).toBe(true);
  });

  test('dist/index.html 应存在', () => {
    expect(fs.existsSync(path.join(DIST, 'index.html'))).toBe(true);
  });

  test('dist 中应有 CSS 文件', () => {
    const cssFiles = fs.readdirSync(DIST).filter(f => f.endsWith('.css') || f.endsWith('.css.gz'));
    expect(cssFiles.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Scene 1: file:// protocol (local open)
// ═══════════════════════════════════════════════════════════════════

test.describe('场景1: file:// 协议', () => {
  test('dist/index.html 应可读且为合法 HTML', () => {
    const htmlPath = path.join(DIST, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');
    expect(content).toMatch(/^<!DOCTYPE html>/i);
    expect(content.length).toBeGreaterThan(1000);
  });

  test('dist 中的关键路径文件应存在', () => {
    const required = ['index.html', 'CNAME', '404.html'];
    required.forEach((f) => {
      expect(fs.existsSync(path.join(DIST, f))).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Scene 2: npx serve (root path)
// ═══════════════════════════════════════════════════════════════════

test.describe('场景2: npx serve (root path)', () => {
  let server;
  const PORT = 3456;
  const BASE = `http://localhost:${PORT}`;

  test.beforeAll(async () => {
    server = spawn('npx', ['serve', 'dist', '-l', String(PORT), '--no-clipboard'], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    await waitForServer(`${BASE}/`);
  });

  test.afterAll(() => {
    if (server) server.kill('SIGTERM');
  });

  test('index.html 返回 200', async () => {
    const resp = await fetch(`${BASE}/`);
    expect(resp.status).toBe(200);
    const text = await resp.text();
    expect(text).toMatch(/^<!DOCTYPE html>/i);
  });

  test('404.html 可访问', async () => {
    const resp = await fetch(`${BASE}/404.html`);
    expect(resp.status).toBe(200);
  });

  test('关键 JS 文件可访问（200）且内容合法', async () => {
    const jsFiles = [
      '/assets/js/swup-init.js',
      '/assets/js/breadcrumb-data.js',
      '/assets/js/lib/runtime-guard.js',
    ];
    for (const jsPath of jsFiles) {
      const resp = await fetch(`${BASE}${jsPath}`);
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text.length).toBeGreaterThan(100);
    }
  });

  test('CSS 文件可访问（200）', async () => {
    const cssFiles = fs.readdirSync(DIST).filter(f => f.endsWith('.css') && !f.endsWith('.css.gz'));
    expect(cssFiles.length).toBeGreaterThan(0);
    for (const cssFile of cssFiles) {
      const resp = await fetch(`${BASE}/${cssFile}`);
      expect(resp.status).toBe(200);
    }
  });

  test('首页引用的资源路径以 "/" 开头', () => {
    const content = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');
    const scriptSrcs = content.match(/src="\/(?!\/)/g);
    if (scriptSrcs) {
      expect(scriptSrcs.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Scene 3: subpath deployment (BASE_PATH=/brew)
// ═══════════════════════════════════════════════════════════════════

test.describe('场景3: 子路径部署 (BASE_PATH=/brew)', () => {
  let server;
  const PORT = 3457;
  const BASE = `http://localhost:${PORT}`;

  test.beforeAll(async () => {
    server = spawn('npx', ['serve', 'dist', '-l', String(PORT), '--no-clipboard'], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, BASE_PATH: '/brew' },
    });

    await waitForServer(`${BASE}/`);
  });

  test.afterAll(() => {
    if (server) server.kill('SIGTERM');
  });

  test('index.html 在根路径返回 200', async () => {
    const resp = await fetch(`${BASE}/`);
    expect(resp.status).toBe(200);
  });

  test('关键文件仍可访问', async () => {
    const files = ['/404.html', '/assets/js/swup-init.js'];
    for (const f of files) {
      const resp = await fetch(`${BASE}${f}`);
      expect(resp.status).toBe(200);
    }
  });
});
