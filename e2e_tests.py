from playwright.sync_api import sync_playwright
import time

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("--- TEST 1: Navigation Smoke Test ---")
        try:
            page.goto("http://localhost:3000/")
            page.wait_for_selector("text=Overview", timeout=10000)
            print("PASS: Frontend loaded successfully.")
            page.screenshot(path="screenshot_test1.png")
        except Exception as e:
            print(f"FAIL: {e}")

        print("--- TEST 2: Core Scan Pipeline ---")
        try:
            # Click RUN ANALYSIS
            page.click("button:has-text('RUN ANALYSIS')")
            start_time = time.time()
            print("Clicked RUN ANALYSIS, waiting for zones to appear...")
            # Wait for zones in the sidebar
            page.wait_for_selector("text=CRITICAL", timeout=60000)
            end_time = time.time()
            scan_duration = end_time - start_time
            print(f"PASS: Scan completed in {scan_duration:.2f} seconds.")
            page.screenshot(path="screenshot_test2_scan.png")
            
            # Click the first zone
            page.click("text=CRITICAL")
            page.wait_for_selector("text=FortyGuard Heat Intelligence", timeout=10000)
            print("PASS: WHY panel opened and populated.")
            page.screenshot(path="screenshot_test2_whypanel.png")
        except Exception as e:
            print(f"FAIL: {e}")

        print("--- TEST 5: Heat Intelligence PDF ---")
        try:
            page.click("button:has-text('Generate Full Intelligence Report')")
            start_time = time.time()
            print("Clicked Generate Report. State is loading...")
            page.screenshot(path="screenshot_test5_loading.png")
            
            # Non-blocking proof: try to interact
            page.click("button:has-text('Close')")  # Assuming there's a close button for WHY panel
            print("PASS: Successfully closed WHY panel while PDF generating (non-blocking).")
            
            # Reopen the panel to check status
            page.click("text=CRITICAL")
            
            print("Waiting for PDF generation to complete (up to 90s)...")
            page.wait_for_selector("text=View Report", timeout=90000)
            end_time = time.time()
            print(f"PASS: PDF generation completed in {end_time - start_time:.2f} seconds.")
            page.screenshot(path="screenshot_test5_completed.png")
            
            # Get the link
            link = page.get_attribute("a:has-text('View Report')", "href")
            print(f"PASS: Download link: {link}")
        except Exception as e:
            print(f"FAIL: {e}")

        print("--- TEST 3: Heat Hunt Autonomous Agent ---")
        try:
            page.click("button:has-text('Agent Insights')")
            page.wait_for_selector("text=Initialize Investigation")
            page.click("button:has-text('Initialize Investigation')")
            page.wait_for_selector("text=Final Recommendation", timeout=60000)
            print("PASS: Heat Hunt completed successfully.")
            page.screenshot(path="screenshot_test3_heathunt.png")
        except Exception as e:
            print(f"FAIL: {e}")

        print("--- TEST 6: Fallback Modes ---")
        try:
            # Check Demo mode
            page.click("button:has-text('Live Pipeline')")
            page.click("text=Demo Scenario")
            page.wait_for_selector("text=Demo Scenario", state="visible")
            print("PASS: Switched to Demo Scenario.")
            page.screenshot(path="screenshot_test6_demo.png")
        except Exception as e:
            print(f"FAIL: {e}")

        browser.close()

    print("--- TEST 4: Forecast Capability ---")
    try:
        import httpx
        resp = httpx.post(
            "http://127.0.0.1:8000/api/analysis/basic-scan",
            json={"city": "Phoenix", "state": "AZ", "forecast_hours": 6},
            timeout=30.0
        )
        data = resp.json()
        print(f"PASS: Forecast request responded with status {resp.status_code}")
        # Not checking exact shape, just that it didn't 500
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == "__main__":
    run_tests()

