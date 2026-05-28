import time
import os
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Ensure scratch directory exists
os.makedirs('scratch', exist_ok=True)
out_file = 'scratch/selenium_output.txt'

with open(out_file, 'w', encoding='utf-8') as log_out:
    def log(msg):
        log_out.write(str(msg) + '\n')
        # Print safely to console
        try:
            print(str(msg).encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding))
        except Exception:
            print("[EncError] Log written to file.")

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        log("Navigating to http://localhost:8000/en/...")
        driver.get("http://localhost:8000/en/")
        
        # Wait for body
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        log(f"Page Title: {driver.title}")
        
        # Wait for the aptList to have children (which indicates data has loaded)
        log("Waiting for list items to load...")
        try:
            # Wait up to 15 seconds for at least one list item to appear
            element = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "listBox2"))
            )
            log(f"List items loaded! First item HTML: {element.get_attribute('outerHTML')[:200]}")
            
            # Click the element using JS to avoid interception
            driver.execute_script("arguments[0].click();", element)
            log("Clicked the list item via JS!")
            
            # Wait for modal to load content (it might have an animation)
            time.sleep(3)
            
            log("Extracting modal content...")
            modal = driver.find_element(By.ID, "baseModal")
            log("--- Modal Text Content ---")
            log(modal.text)
            
        except Exception as e:
            log(f"Error waiting/finding list items: {e}")
            
    finally:
        driver.quit()
