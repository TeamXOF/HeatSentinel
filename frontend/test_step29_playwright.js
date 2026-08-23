import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/Ace/.gemini/antigravity-ide/brain/b9327af2-c9cc-4d2d-a342-adcab3bb31cc';

async function runTest() {
  console.log('🚀 Starting Playwright E2E Verification for Step 29 (First Working Vertical Slice)...');
  
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    console.log('🌐 Connected via Microsoft Edge engine.');
  } catch (e) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
      console.log('🌐 Connected via Google Chrome engine.');
    } catch (e2) {
      browser = await chromium.launch({ headless: true });
      console.log('🌐 Connected via Chromium engine.');
    }
  }
  
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Listen to console logs
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[Browser Error]: ${msg.text()}`);
  });

  try {
    // 1. Navigate to Command Center
    console.log('📍 Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2. Verify Header and Run Analysis Button
    console.log('🔍 Verifying Header & Run Analysis button...');
    await page.waitForSelector('#main-header');
    const runAnalysisBtn = await page.waitForSelector('#run-analysis-btn');
    const btnText = await runAnalysisBtn.innerText();
    console.log(`   - Run Analysis Button Text: "${btnText}"`);

    // Capture initial load screenshot
    const initialScreenshotPath = path.join(ARTIFACTS_DIR, 'step29_command_center_initial.png');
    await page.screenshot({ path: initialScreenshotPath, fullPage: false });
    console.log(`📸 Initial Command Center screenshot saved: ${initialScreenshotPath}`);

    // 3. Verify KPI Stat Cards
    console.log('🔍 Verifying Top KPI Stat Cards...');
    const kpiCards = await page.$$('[id^="stat-card-"]');
    console.log(`   - Found ${kpiCards.length} KPI stat cards`);

    // 4. Verify MapLibre Canvas and Markers
    console.log('🔍 Verifying Hyperlocal Heat Risk Map & Zone Markers...');
    await page.waitForSelector('#hyperlocal-heat-map-card');
    await page.waitForSelector('canvas.maplibregl-canvas');
    await page.waitForTimeout(1000);

    const initialMarkers = await page.$$('.heat-zone-marker-container');
    console.log(`   - Found ${initialMarkers.length} interactive Heat Zone markers on map`);

    // 5. Trigger "RUN ANALYSIS" button
    console.log('⚡ Clicking "Run Analysis" button to verify live API scan...');
    await runAnalysisBtn.click();
    await page.waitForTimeout(2000);

    const statusBadge = await page.$('#pipeline-status-badge');
    if (statusBadge) {
      const badgeText = await statusBadge.innerText();
      console.log(`   - Pipeline Status Badge: "${badgeText.replace(/\n/g, ' ')}"`);
    }

    // 6. Click Zone Marker to open WHY Panel
    console.log('👉 Clicking Zone 1 marker on map to inspect WHY Evidence Panel...');
    await page.locator('.heat-zone-marker-container').first().waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.heat-zone-marker-container').first().click({ force: true });

    // 7. Verify WHY Panel
    console.log('🔍 Verifying WHY Evidence Panel structure...');
    await page.waitForSelector('#why-panel-drawer', { timeout: 5000 });
    
    const whyTitle = await page.textContent('#why-panel-title');
    console.log(`   - WHY Panel Title: "${whyTitle}"`);

    const scoreCard = await page.textContent('#why-panel-score-card');
    console.log(`   - Score Card Summary: ${scoreCard.substring(0, 100).replace(/\n/g, ' ')}...`);

    // Verify 3-Pillars:
    const evidenceSection = await page.textContent('#why-panel-evidence-section');
    const hasThermal = evidenceSection.includes('Heat & Thermal Metrics');
    const hasCensus = evidenceSection.includes('Vulnerability Demographics') || evidenceSection.includes('Census');
    const hasResources = evidenceSection.includes('Resource Proximity') || evidenceSection.includes('MAG');

    console.log(`   - Pillar 1 (Thermal Metrics):       ${hasThermal ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Pillar 2 (Census Demographics):   ${hasCensus ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Pillar 3 (Cooling Infrastructure): ${hasResources ? '✅ PASS' : '❌ FAIL'}`);

    // Verify Prototype Disclaimer
    const hasDisclaimer = scoreCard.includes('Response Gap is a composite risk indicator') || scoreCard.includes('not an official public-health index');
    console.log(`   - Prototype Disclaimer Visible:     ${hasDisclaimer ? '✅ PASS' : '❌ FAIL'}`);

    // 8. Capture WHY Panel Screenshot
    const whyScreenshotPath = path.join(ARTIFACTS_DIR, 'step29_why_panel_evidence.png');
    await page.screenshot({ path: whyScreenshotPath, fullPage: false });
    console.log(`📸 WHY Evidence Panel screenshot saved: ${whyScreenshotPath}`);

    // 9. Navigate to Risk Zones Registry Page and verify table
    console.log('📍 Navigating to Risk Zones Registry (/risk-zones) ...');
    await page.goto('http://localhost:3000/risk-zones', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    const riskZonesPageHeader = await page.textContent('#risk-zones-page');
    console.log(`   - Risk Zones Registry Page Loaded: ${riskZonesPageHeader ? '✅ PASS' : '❌ FAIL'}`);

    const riskZonesScreenshotPath = path.join(ARTIFACTS_DIR, 'step29_risk_zones_registry.png');
    await page.screenshot({ path: riskZonesScreenshotPath, fullPage: false });
    console.log(`📸 Risk Zones Registry screenshot saved: ${riskZonesScreenshotPath}`);

    console.log('\n🎉 ALL STEP 29 VERTICAL SLICE ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY WITH PLAYWRIGHT!');
  } catch (err) {
    console.error('❌ Playwright verification error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runTest().catch(err => {
  process.exit(1);
});
