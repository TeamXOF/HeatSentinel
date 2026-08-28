import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('./qa_screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const errors = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '01_overview.png'), fullPage: true });

  const routes = [
    { name: '02_heatmap', path: '/heat-map' },
    { name: '03_risk_zones', path: '/risk-zones' },
    { name: '04_events_alerts', path: '/events-alerts' },
    { name: '05_agent_insights', path: '/agent-insights' },
    { name: '06_resources', path: '/resources' },
    { name: '07_response_planner', path: '/response-planner' },
    { name: '08_reports', path: '/reports' },
    { name: '09_data_explorer', path: '/data-explorer' },
    { name: '10_settings', path: '/settings' }
  ];

  for (const route of routes) {
    try {
      console.log(`Auditing ${route.name} (${route.path})...`);
      await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, `${route.name}.png`), fullPage: true });
    } catch (e) {
      console.error(`Error on route ${route.path}:`, e.message);
    }
  }

  // Also test mobile view (390x844 - iPhone 14/15 size)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, 'mobile_overview.png'), fullPage: true });

  console.log('QA Screenshots taken successfully.');
  console.log('Console logs captured:', consoleLogs.length);
  console.log('Errors captured:', errors);

  await browser.close();
}

audit().catch(console.error);
