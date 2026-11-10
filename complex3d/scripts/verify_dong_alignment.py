import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

PORT = 8884

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), QuietHandler)
    server.serve_forever()

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(1)

options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1600,1000")
options.add_argument("--use-gl=angle")
options.add_argument("--enable-webgl")
options.add_argument("--hide-scrollbars")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=options)

try:
    url = f"http://127.0.0.1:{PORT}/complex3d.html?code=111515"
    print(f"Loading {url}...")
    driver.get(url)
    time.sleep(3)

    # 1. Coordinate alignment check across all residential dongs
    check_results = driver.execute_script("""
        var scene = complex3d_instance.scene;
        var floorMeshes = [];
        var dongSprites = {};

        scene.traverse(function(obj) {
            if (obj.isMesh && obj.userData && obj.userData.isFloor) {
                floorMeshes.push(obj);
            }
            if (obj.isSprite && obj.userData && obj.userData.isDongLabel) {
                dongSprites[obj.userData.dongKey] = obj;
            }
        });

        var dongGroups = {};
        floorMeshes.forEach(function(m) {
            var k = m.userData.dong;
            if (!dongGroups[k]) dongGroups[k] = [];
            dongGroups[k].push(m);
        });

        var maxDeltaXZ = 0;
        var results = [];

        Object.keys(dongSprites).forEach(function(k) {
            var floors = dongGroups[k];
            if (!floors || floors.length === 0) return;

            var minX = 9999, maxX = -9999, minZ = 9999, maxZ = -9999, maxY = -9999;
            floors.forEach(function(m) {
                m.geometry.computeBoundingBox();
                var b = m.geometry.boundingBox;
                var posY = m.position.y;
                if (b.min.x < minX) minX = b.min.x;
                if (b.max.x > maxX) maxX = b.max.x;
                if (b.min.z < minZ) minZ = b.min.z;
                if (b.max.z > maxZ) maxZ = b.max.z;
                if (posY + b.max.y > maxY) maxY = posY + b.max.y;
            });

            var bldgCenterX = (minX + maxX) / 2;
            var bldgCenterZ = (minZ + maxZ) / 2;
            var bldgRoofY = maxY;

            var sprite = dongSprites[k];
            var spX = sprite.position.x;
            var spY = sprite.position.y;
            var spZ = sprite.position.z;

            var dx = spX - bldgCenterX;
            var dz = spZ - bldgCenterZ;
            var dy = spY - bldgRoofY;
            var deltaXZ = Math.sqrt(dx * dx + dz * dz);

            if (deltaXZ > maxDeltaXZ) maxDeltaXZ = deltaXZ;

            results.push({
                dong: k,
                bldgCenter: { x: bldgCenterX, y: bldgRoofY, z: bldgCenterZ },
                spritePos: { x: spX, y: spY, z: spZ },
                deltaXZ: deltaXZ,
                deltaY: dy
            });
        });

        return {
            totalLabelsChecked: results.length,
            maxDeltaXZ: maxDeltaXZ,
            sample: results.slice(0, 5)
        };
    """)

    import json
    print("Alignment Check Results:")
    print(json.dumps(check_results, indent=2, ensure_ascii=False))

    # Capture overview screenshot
    driver.save_screenshot("preview_dong_labels_fixed.png")
    print("Saved preview_dong_labels_fixed.png")

    # Focus on specific dong (e.g. 202동) to verify close-up rooftop alignment
    print("Focusing on 202동...")
    driver.execute_script("""
        var btn = Array.from(document.querySelectorAll('.dong-btn')).find(b => b.textContent === '202동');
        if (btn) btn.click();
    """)
    time.sleep(1.5)
    driver.save_screenshot("preview_dong_202_closeup.png")
    print("Saved preview_dong_202_closeup.png")

finally:
    driver.quit()
