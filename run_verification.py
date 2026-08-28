import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    out_dir = "qa_verification_results"
    os.makedirs(out_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # --- ITEM 1: Header at 1440px and 768px ---
        print("Verifying Item 1: Header at 1440px and 768px...")
        desktop_ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page_1440 = desktop_ctx.new_page()
        page_1440.goto("http://localhost:3000/", wait_until="load")
        time.sleep(1.5)
        # Capture header area on 1440px
        header_el = page_1440.locator("#main-header")
        header_el.screenshot(path=f"{out_dir}/item1_header_1440px.png")
        page_1440.screenshot(path=f"{out_dir}/item1_overview_1440px.png")
        
        # 768px tablet header
        tablet_ctx = browser.new_context(viewport={"width": 768, "height": 1024})
        page_768 = tablet_ctx.new_page()
        page_768.goto("http://localhost:3000/", wait_until="load")
        time.sleep(1.5)
        header_768_el = page_768.locator("#main-header")
        header_768_el.screenshot(path=f"{out_dir}/item1_header_768px.png")
        page_768.screenshot(path=f"{out_dir}/item1_overview_768px.png")

        # --- ITEM 2: KPI Grid at 1440x900 ---
        print("Verifying Item 2: KPI Grid at 1440x900...")
        kpi_el = page_1440.locator("#kpi-stat-cards-container")
        kpi_el.screenshot(path=f"{out_dir}/item2_kpi_grid_1440px.png")

        # --- ITEM 3: Risk Zones empty state ---
        print("Verifying Item 3: Risk Zones Page (Empty State)...")
        page_1440.goto("http://localhost:3000/risk-zones", wait_until="load")
        time.sleep(1.5)
        page_1440.screenshot(path=f"{out_dir}/item3_risk_zones_empty_state.png", full_page=True)

        # --- ITEM 4: Response Planner vs Alert Center ---
        print("Verifying Item 4: Response Planner badges...")
        page_1440.goto("http://localhost:3000/response-planner", wait_until="load")
        time.sleep(1.5)
        page_1440.screenshot(path=f"{out_dir}/item4_response_planner_badges.png", full_page=True)
        page_1440.goto("http://localhost:3000/events-alerts", wait_until="load")
        time.sleep(1.5)
        page_1440.screenshot(path=f"{out_dir}/item4_events_alerts_badges.png", full_page=True)

        # --- ITEM 5: Bottom Scroll Padding on Overview & Resources ---
        print("Verifying Item 5: Bottom scroll padding...")
        page_1440.goto("http://localhost:3000/", wait_until="load")
        time.sleep(2.0)
        page_1440.evaluate("document.getElementById('main-scrollable-content').scrollTop = 999999")
        time.sleep(0.8)
        page_1440.screenshot(path=f"{out_dir}/item5_overview_scrolled_bottom.png")
        
        page_1440.goto("http://localhost:3000/resources", wait_until="load")
        time.sleep(2.0)
        page_1440.evaluate("document.getElementById('main-scrollable-content').scrollTop = 999999")
        time.sleep(0.8)
        page_1440.screenshot(path=f"{out_dir}/item5_resources_scrolled_bottom.png")

        # --- FULL 10-PAGE REGRESSION PASS ---
        print("Running full 10-page regression pass on 1440x900 and mobile 390x844...")
        routes = [
            ("reg_01_overview", "/"),
            ("reg_02_heatmap", "/heat-map"),
            ("reg_03_risk_zones", "/risk-zones"),
            ("reg_04_events_alerts", "/events-alerts"),
            ("reg_05_agent_insights", "/agent-insights"),
            ("reg_06_resources", "/resources"),
            ("reg_07_response_planner", "/response-planner"),
            ("reg_08_reports", "/reports"),
            ("reg_09_data_explorer", "/data-explorer"),
            ("reg_10_settings", "/settings"),
        ]

        for name, r in routes:
            try:
                page_1440.goto(f"http://localhost:3000{r}", wait_until="load", timeout=10000)
                time.sleep(1.0)
                page_1440.screenshot(path=f"{out_dir}/{name}_desktop.png")
            except Exception as e:
                print(f"Desktop route {r} error: {e}")

        mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        mobile_page = mobile_ctx.new_page()
        for name, r in routes:
            try:
                mobile_page.goto(f"http://localhost:3000{r}", wait_until="load", timeout=10000)
                time.sleep(1.0)
                mobile_page.screenshot(path=f"{out_dir}/{name}_mobile.png")
            except Exception as e:
                print(f"Mobile route {r} error: {e}")

        print("Verification & regression screenshots captured successfully.")
        browser.close()

if __name__ == "__main__":
    run_verification()
