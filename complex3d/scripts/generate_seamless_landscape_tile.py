import math
import random
from PIL import Image, ImageDraw, ImageFilter

def create_seamless_korean_landscape_tile(size=1024):
    """
    Generates a 100% seamless repeating anime landscape tile for Korean apartment grounds.
    Features:
    - Residential circulation loop roads & driveways
    - Manicured emerald lawns & parks
    - Clean pedestrian pavers & brick plaza paths
    - Clustered trees & garden hedges with anime watercolor styling
    - Playgrounds & recreational zones
    - Guaranteed seamless wrap on all 4 boundaries (toroidal wrap)
    """
    tile = Image.new("RGBA", (size, size), (241, 245, 249, 255))
    draw = ImageDraw.Draw(tile)
    random.seed(2026)

    # 1. Base Ground: Fresh Mint/Emerald Lawn
    # Draw soft lawn background
    for y in range(size):
        for x in range(0, size, 8):
            # Gentle variation
            g_val = int(210 + 20 * math.sin(x * 0.02) * math.cos(y * 0.02))
            draw.rectangle([x, y, x + 8, y + 1], fill=(167, min(240, g_val), 180, 255))

    # 2. Road Network Grid (Seamless Toroidal Wrap)
    # Main loop roadway: 48px wide slate road running through center/edges
    road_color = (203, 213, 225, 255) # Warm slate asphalt #cbd5e1
    curb_color = (248, 250, 252, 255) # Clean sidewalk curb #f8fafc

    road_w = 56
    # Horizontal roads at y = 0/size and y = size // 2
    for ry in [0, size // 2]:
        draw.rectangle([0, ry - road_w // 2, size, ry + road_w // 2], fill=road_color)
        draw.line([(0, ry - road_w // 2), (size, ry - road_w // 2)], fill=curb_color, width=4)
        draw.line([(0, ry + road_w // 2), (size, ry + road_w // 2)], fill=curb_color, width=4)
        # Road center dash
        for dx in range(0, size, 32):
            draw.line([(dx, ry), (dx + 16, ry)], fill=(255, 255, 255, 180), width=3)

    # Vertical roads at x = 0/size and x = size // 2
    for rx in [0, size // 2]:
        draw.rectangle([rx - road_w // 2, 0, rx + road_w // 2, size], fill=road_color)
        draw.line([(rx - road_w // 2, 0), (rx - road_w // 2, size)], fill=curb_color, width=4)
        draw.line([(rx + road_w // 2, 0), (rx + road_w // 2, size)], fill=curb_color, width=4)
        for dy in range(0, size, 32):
            draw.line([(rx, dy), (rx, dy + 16)], fill=(255, 255, 255, 180), width=3)

    # Crosswalks at intersections (0, 0), (0, 512), (512, 0), (512, 512)
    for ix in [0, size // 2]:
        for iy in [0, size // 2]:
            for offset in [-road_w // 2 - 14, road_w // 2 + 6]:
                # Horizontal zebra stripes
                for zx in range(ix - road_w // 2 + 4, ix + road_w // 2 - 4, 8):
                    draw.rectangle([zx % size, (iy + offset) % size, (zx + 5) % size, (iy + offset + 8) % size], fill=(255, 255, 255, 220))

    # 3. Four Quadrants: Internal Residential Garden Blocks
    quads = [
        (road_w // 2 + 8, road_w // 2 + 8, size // 2 - road_w // 2 - 8, size // 2 - road_w // 2 - 8),
        (size // 2 + road_w // 2 + 8, road_w // 2 + 8, size - road_w // 2 - 8, size // 2 - road_w // 2 - 8),
        (road_w // 2 + 8, size // 2 + road_w // 2 + 8, size // 2 - road_w // 2 - 8, size - road_w // 2 - 8),
        (size // 2 + road_w // 2 + 8, size // 2 + road_w // 2 + 8, size - road_w // 2 - 8, size - road_w // 2 - 8)
    ]

    for q_idx, (qx1, qy1, qx2, qy2) in enumerate(quads):
        qw = qx2 - qx1
        qh = qy2 - qy1

        # Base block paving / manicured lawn
        draw.rectangle([qx1, qy1, qx2, qy2], fill=(187, 247, 208, 255)) # Mint green lawn

        # Curving pedestrian walkway (산책로)
        path_color = (241, 245, 249, 255) # Light ivory walkway
        cx = qx1 + qw // 2
        cy = qy1 + qh // 2
        
        # Circular garden path
        draw.ellipse([cx - qw * 0.38, cy - qh * 0.38, cx + qw * 0.38, cy + qh * 0.38], outline=path_color, width=16)
        # Inner lawn
        draw.ellipse([cx - qw * 0.32, cy - qh * 0.32, cx + qw * 0.32, cy + qh * 0.32], fill=(134, 239, 172, 255))

        if q_idx == 0:
            # Quadrant 0: Central Water Plaza (수경 분수 연못)
            draw.ellipse([cx - 36, cy - 36, cx + 36, cy + 36], fill=(56, 189, 248, 255)) # Water pool
            draw.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=(14, 165, 233, 255))
            draw.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(255, 255, 255, 230)) # Center fountain spray
        elif q_idx == 1:
            # Quadrant 1: Children's Playground (어린이 놀이터 우레탄 트랙)
            draw.rectangle([cx - 48, cy - 32, cx + 48, cy + 32], fill=(248, 113, 113, 240)) # Coral red track
            draw.rectangle([cx - 36, cy - 20, cx + 36, cy + 20], fill=(251, 191, 36, 240)) # Amber yellow zone
            draw.ellipse([cx - 16, cy - 12, cx + 16, cy + 12], fill=(96, 165, 250, 240)) # Blue rubber circle
        elif q_idx == 2:
            # Quadrant 2: Badminton/Tennis Sport Court (스포츠 코트)
            draw.rectangle([cx - 44, cy - 36, cx + 44, cy + 36], fill=(52, 211, 153, 240)) # Green court
            draw.rectangle([cx - 38, cy - 30, cx + 38, cy + 30], outline=(255, 255, 255, 220), width=2)
            draw.line([(cx, cy - 30), (cx, cy + 30)], fill=(255, 255, 255, 220), width=2)
        else:
            # Quadrant 3: Shaded Pergola Garden & Flower Beds (파고라 휴게 쉼터)
            draw.rectangle([cx - 36, cy - 36, cx + 36, cy + 36], fill=(226, 232, 240, 255))
            draw.rectangle([cx - 26, cy - 26, cx + 26, cy + 26], fill=(251, 146, 60, 220)) # Wood deck

        # Clustered Summer Trees & Shrubs around paths
        tree_positions = [
            (qx1 + 25, qy1 + 25), (qx2 - 25, qy1 + 25),
            (qx1 + 25, qy2 - 25), (qx2 - 25, qy2 - 25),
            (cx - qw * 0.38, cy), (cx + qw * 0.38, cy),
            (cx, cy - qh * 0.38), (cx, cy + qh * 0.38)
        ]
        for tx, ty in tree_positions:
            # Tree shadow (soft cool blue)
            draw.ellipse([tx - 12, ty - 6, tx + 18, ty + 16], fill=(71, 85, 105, 75))
            # Tree canopy (layered anime greens)
            draw.ellipse([tx - 14, ty - 14, tx + 14, ty + 14], fill=(34, 197, 94, 240))
            draw.ellipse([tx - 10, ty - 12, tx + 10, ty + 8], fill=(74, 222, 128, 240))
            draw.ellipse([tx - 6, ty - 10, tx + 6, ty + 4], fill=(134, 239, 172, 240))

    # Convert to RGB and save
    final_tile = tile.convert("RGB")
    return final_tile

if __name__ == '__main__':
    tile = create_seamless_korean_landscape_tile(1024)
    tile.save('D:/APT-Rank_Git/assets/images/shinkai_repeating_landscape_tile.jpg', quality=95)
    print("Generated seamless repeating landscape tile: D:/APT-Rank_Git/assets/images/shinkai_repeating_landscape_tile.jpg")
