import time
import os
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
artifacts_dir = r"C:\Users\anito\.gemini\antigravity\brain\38447711-5a52-4de1-99c4-0133843b4a5f"

try:
    print("Navigating to http://127.0.0.1:5500/complex3d.html?code=8289 ...")
    driver.get("http://127.0.0.1:5500/complex3d.html?code=8289")
    time.sleep(4)

    # 1. Verify 601동 units structure and orientation
    res = driver.execute_script("""
        var inst = window.viewInstance;
        var dong601Units = [];
        inst.scene.traverse(function(node) {
            if (node.userData && (node.userData.dong === '601동' || node.userData.dong === '601') && node.userData.isUnit) {
                dong601Units.push({
                    floor: node.userData.floor,
                    lineNum: node.userData.lineNum,
                    hoName: node.userData.hoName,
                    pyeong: node.userData.pyeong,
                    x: node.position.x,
                    y: node.position.y,
                    z: node.position.z
                });
            }
        });
        
        // Check unit count on 15F vs 22F
        var units15F = dong601Units.filter(function(u) { return u.floor === 15; });
        var units22F = dong601Units.filter(function(u) { return u.floor === 22; });
        
        return {
            totalUnits601: dong601Units.length,
            units15F: units15F,
            units22F: units22F
        };
    """)
    print("601동 Total Units:", res['totalUnits601'])
    print("15F Units:", [u['hoName'] + f" ({u['pyeong']}평)" for u in res['units15F']])
    print("22F Units:", [u['hoName'] + f" ({u['pyeong']}평)" for u in res['units22F']])

    # Take screenshot of overview
    driver.save_screenshot(os.path.join(artifacts_dir, "test_unit_overview_601.png"))
    print("Saved test_unit_overview_601.png")

    # 2. Select 15F unit 1501호 and enter outward POV
    pov_result = driver.execute_script("""
        var inst = window.viewInstance;
        var targetUnit = null;
        inst.scene.traverse(function(node) {
            if (node.userData && (node.userData.dong === '601동' || node.userData.dong === '601') && node.userData.hoName === '1501호') {
                targetUnit = node;
            }
        });
        if (targetUnit) {
            inst.viewFloorPOV(targetUnit, 'outward');
            return {
                found: true,
                hoName: targetUnit.userData.hoName,
                lineNum: targetUnit.userData.lineNum
            };
        }
        return { found: false };
    """)
    print("1501호 POV result:", pov_result)
    time.sleep(1.2)

    label_1501 = driver.find_element("id", "pov-unit-label").text
    print("POV Unit Label for 1501호:", label_1501)
    driver.save_screenshot(os.path.join(artifacts_dir, "test_unit_pov_1501.png"))
    print("Saved test_unit_pov_1501.png")

    # 3. Shift to next unit (1502호 -> 1503호 -> 1504호)
    for expected in ['1502호', '1503호', '1504호']:
        driver.execute_script("window.viewInstance.shiftBalconyUnit(1);")
        time.sleep(0.6)
        cur_label = driver.find_element("id", "pov-unit-label").text
        cam_x = driver.execute_script("return window.viewInstance.camera.position.x;")
        print(f"Shifted -> Expected {expected}, got label: {cur_label}, cam_x: {cam_x:.2f}")

    driver.save_screenshot(os.path.join(artifacts_dir, "test_unit_pov_1504.png"))
    print("Saved test_unit_pov_1504.png")

    # 4. Check that at 1504호, next button is disabled
    next_btn = driver.find_element("id", "pov-btn-next-unit")
    print("1504호 is next button disabled?:", not next_btn.is_enabled())

    # 5. Shift back to 1501호
    for _ in range(3):
        driver.execute_script("window.viewInstance.shiftBalconyUnit(-1);")
        time.sleep(0.4)
    label_back = driver.find_element("id", "pov-unit-label").text
    prev_btn = driver.find_element("id", "pov-btn-prev-unit")
    print("Shifted back to:", label_back, "is prev button disabled?:", not prev_btn.is_enabled())

    # 6. Now select 22층 (which only has lines 1 & 2: 2201호, 2202호)
    driver.execute_script("""
        var inst = window.viewInstance;
        var unit2201 = null;
        inst.scene.traverse(function(node) {
            if (node.userData && (node.userData.dong === '601동' || node.userData.dong === '601') && node.userData.hoName === '2201호') {
                unit2201 = node;
            }
        });
        if (unit2201) {
            inst.viewFloorPOV(unit2201, 'outward');
        }
    """)
    time.sleep(1.2)
    label_2201 = driver.find_element("id", "pov-unit-label").text
    print("22층 1호 label:", label_2201)
    driver.save_screenshot(os.path.join(artifacts_dir, "test_unit_pov_2201.png"))
    print("Saved test_unit_pov_2201.png")

    # Shift next to 2202호
    driver.execute_script("window.viewInstance.shiftBalconyUnit(1);")
    time.sleep(0.6)
    label_2202 = driver.find_element("id", "pov-unit-label").text
    next_2202 = driver.find_element("id", "pov-btn-next-unit")
    print("22층 2호 label:", label_2202, "is next button disabled?:", not next_2202.is_enabled())

    # 7. Check 601동 orientation visual: Let's rotate camera to look South from North-East
    # so we see 601동 clearly
    driver.execute_script("""
        var inst = window.viewInstance;
        inst.exitFloorPOV();
    """)
    time.sleep(1.0)
    driver.execute_script("""
        var inst = window.viewInstance;
        // Position camera to look directly at 601동 from the South (front view)
        // 601동 center is around X = -84, Z = -31
        inst.camera.position.set(-84, 45, 90);
        inst.controls.target.set(-84, 35, -31);
        inst.camera.lookAt(-84, 35, -31);
        inst.controls.update();
    """)
    time.sleep(1.0)
    driver.save_screenshot(os.path.join(artifacts_dir, "test_601_south_front_view.png"))
    print("Saved test_601_south_front_view.png")

finally:
    driver.quit()
