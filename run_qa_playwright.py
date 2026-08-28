import os
import time
from playwright.sync_api import sync_playwright

def run_qa_audit():
    os.makedirs("qa_results", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Desktop context
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_messages = []
        page_errors = []

        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        routes = [
            ("01_overview", "/"),
            ("02_heatmap", "/heat-map"),
            ("03_risk_zones", "/risk-zones"),
            ("04_events_alerts", "/events-alerts"),
            ("05_agent_insights", "/agent-insights"),
            ("06_resources", "/resources"),
            ("07_response_planner", "/response-planner"),
            ("08_reports", "/reports"),
            ("09_data_explorer", "/data-explorer"),
            ("10_settings", "/settings"),
        ]

        print("Navigating through routes on Desktop (1440x900)...")
        for name, route in routes:
            url = f"http://localhost:3000{route}"
            print(f"Loading {url}...")
            try:
                page.goto(url, wait_until="networkidle", timeout=15000)
                time.sleep(1.5)
                page.screenshot(path=f"qa_results/{name}.png", full_page=True)
            except Exception as e:
                print(f"Error loading {name}: {e}")

        # Test mobile viewport
        print("Testing Mobile Viewport (390x844)...")
        mobile_context = browser.new_context(viewport={"width": 390, "height": 844})
        mobile_page = mobile_context.new_page()
        try:
            mobile_page.goto("http://localhost:3000/", wait_until="networkidle", timeout=15000)
            time.sleep(1.5)
            mobile_page.screenshot(path="qa_results/mobile_overview.png", full_page=True)
            
            # Mobile heatmap
            mobile_page.goto("http://localhost:3000/heat-map", wait_until="networkidle", timeout=15000)
            time.sleep(1.5)
            mobile_page.screenshot(path="qa_results/mobile_heatmap.png", full_page=True)
        except Exception as e:
            print(f"Error loading mobile: {e}")

        print("\n--- AUDIT SUMMARY ---")
        print(f"Total Console logs: {len(console_messages)}")
        for log in console_messages:
            if "error" in log.lower() or "warn" in log.lower():
                print(f"  {log}")
        print(f"Total Page errors: {len(page_errors)}")
        for err in page_errors:
            print(f"  ERROR: {err}")

        browser.close()

if __name__ == "__main__":
    run_qa_audit()
