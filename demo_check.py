import os
import time
from playwright.sync_api import sync_playwright

def run_demo_check():
    os.makedirs("demo_evidence", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("Step 1: Navigate to Overview/Risk Zones for Today")
        page.goto("http://localhost:3000/risk-zones", wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="demo_evidence/step1_today_empty.png", full_page=True)
        print("Took screenshot of Today state.")

        print("Step 2: Click 'Load Demo / Historic 7D'")
        try:
            page.click("text=Load Demo / Historic 7D", timeout=5000)
            print("Clicked Load Demo.")
            # It navigates to /agent-insights, so we should go there
        except:
            print("Could not click Load Demo directly. Maybe it's a link to /agent-insights")
            page.goto("http://localhost:3000/agent-insights", wait_until="networkidle")

        time.sleep(15) # Wait for live pipeline
        page.screenshot(path="demo_evidence/step2_historic_loaded.png", full_page=True)
        print("Took screenshot of Historic 7D loaded.")

        print("Let's go back to risk-zones to click a row, if needed, or wait for Heat Hunt")
        # In risk-zones
        page.goto("http://localhost:3000/risk-zones", wait_until="networkidle")
        time.sleep(3)
        
        print("Step 3: Click first zone row")
        try:
            page.click("tr[id^='risk-zone-row-']", timeout=5000)
            time.sleep(2)
            page.screenshot(path="demo_evidence/step3_why_panel_open.png", full_page=True)
            print("Opened Why panel.")
            
            page.click("button:has-text('Generate Full Intelligence Report')", timeout=5000)
            time.sleep(1)
            page.screenshot(path="demo_evidence/step3_generating.png")
            print("Generating PDF...")
            
            for _ in range(12):
                time.sleep(5)
                if page.locator("text=View Report (PDF)").count() > 0:
                    break
            page.screenshot(path="demo_evidence/step3_pdf_ready.png")
            print("PDF ready.")
        except Exception as e:
            print("Could not complete Step 3:", e)

        browser.close()

if __name__ == "__main__":
    run_demo_check()
