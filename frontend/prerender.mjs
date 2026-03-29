/**
 * Standalone prerender script — runs AFTER `yarn build`.
 * Uses Puppeteer directly (v24-compatible) to render each public route
 * and writes the resulting HTML into dist/.
 *
 * Usage:  node prerender.mjs
 */

import puppeteer from 'puppeteer';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, 'dist');

const ROUTES = [
  "/", "/about", "/pricing", "/features", "/comparison",
  "/faq", "/faqs", "/fa-qs", "/contact", "/install", "/install-options",
  "/privacy", "/terms", "/cookie-policy", "/cookie-settings", "/ai-benefits",
  "/getting-started-guide", "/instructions", "/recording-guide",
  "/video-meetings-guide", "/sessions-guide", "/documents-guide",
  "/companies-guide", "/non-profit-solutions", "/multilingual-meetings",
  "/conquering-multilingual-meetings-page", "/remote-teams", "/education",
  "/marketing", "/for-ai-assistants", "/translate-help",
  "/french-education", "/spanish-education", "/german-education",
  "/greek-education", "/korean-education",
  "/marketing-de", "/marketing-el", "/marketing-es", "/marketing-fr", "/marketing-ko",
  "/remote-teams-de", "/remote-teams-el", "/remote-teams-es", "/remote-teams-fr", "/remote-teams-ko",
  "/spanish", "/french", "/german", "/korean", "/polish", "/vietnamese",
  "/portuguese", "/japanese", "/chinese", "/arabic", "/hindi", "/russian",
  "/turkish", "/indonesian", "/malay", "/bengali", "/tagalog", "/thai",
  "/tamil", "/telugu", "/punjabi", "/swahili", "/yoruba", "/zulu",
  "/afrikaans", "/hausa", "/connect-agenda-flow",
];

// Start static file server
const app = express();
app.use(express.static(staticDir, { dotfiles: 'allow' }));
app.use((req, res) => res.sendFile(path.join(staticDir, 'index.html')));

const server = await new Promise((resolve) => {
  const s = app.listen(0, () => resolve(s));
});
const port = server.address().port;
console.log(`[prerender] Serving dist on http://localhost:${port}`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

let ok = 0;
let fail = 0;

for (const route of ROUTES) {
  const page = await browser.newPage();
  try {
    await page.evaluateOnNewDocument(() => {
      window.__PRERENDER_INJECTED = { prerender: true };
    });

    await page.goto(`http://localhost:${port}${route}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for React to render
    await new Promise(r => setTimeout(r, 3000));

    const html = await page.content();

    // Determine output path
    const routePath = route === '/' ? '' : route;
    const outDir = path.join(staticDir, routePath);
    const outFile = path.join(outDir, 'index.html');

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');

    console.log(`[prerender] ✓ ${route} → ${html.length} bytes`);
    ok++;
  } catch (err) {
    console.error(`[prerender] ✗ ${route}: ${err.message}`);
    fail++;
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

console.log(`\n[prerender] Done — ${ok} ok, ${fail} failed`);
if (fail > 0) process.exit(1);
