import math
import random
from PIL import Image, ImageDraw, ImageFilter

def generate_horizon_skyline(width=2048, height=1024, horizon_y=512):
    """
    Generates a rich, layered Makoto Shinkai anime style horizon featuring:
    - Layered distant mountains (원경 산맥: 북한산, 관악산 능선)
    - Distant apartment complex clusters (원경 아파트 단지 및 도심 빌딩 실루엣)
    - Atmospheric perspective mist (공기원근법 연무)
    """
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    random.seed(42) # Consistent, beautiful organic skyline

    # -------------------------------------------------------------
    # 1. 원경 원산 (Far High Mountain Ridge) - 옅은 라벤더-세룰리안 블루
    # -------------------------------------------------------------
    far_mountain = []
    for x in range(0, width + 1, 4):
        # Multi-octave natural ridge
        nx = x / float(width) * 2 * math.pi
        h_offset = (
            math.sin(nx * 3.0 + 0.8) * 45 +
            math.sin(nx * 7.0 + 2.1) * 22 +
            math.sin(nx * 13.0 + 4.5) * 12 +
            math.cos(nx * 21.0) * 6
        )
        # Create notable peaks (e.g. Bukhansan-like sharp rock peaks and gentle ridges)
        if 0.15 < (x / width) < 0.35:
            peak_boost = math.sin((x / width - 0.15) / 0.20 * math.pi) * 35
            h_offset += peak_boost
        if 0.65 < (x / width) < 0.85:
            peak_boost = math.sin((x / width - 0.65) / 0.20 * math.pi) * 30
            h_offset += peak_boost

        y = horizon_y - 40 - h_offset
        far_mountain.append((x, y))

    far_poly = [(0, height)] + far_mountain + [(width, height)]
    # Color: Soft atmospheric lavender azure
    draw.polygon(far_poly, fill=(138, 175, 208, 220))

    # -------------------------------------------------------------
    # 2. 중경 산 (Mid Mountain Ridge) - 짙은 청회색 / 포레스트 블루
    # -------------------------------------------------------------
    mid_mountain = []
    for x in range(0, width + 1, 4):
        nx = x / float(width) * 2 * math.pi
        h_offset = (
            math.sin(nx * 4.0 + 1.5) * 32 +
            math.cos(nx * 9.0 + 0.3) * 18 +
            math.sin(nx * 17.0 + 3.2) * 9
        )
        y = horizon_y - 20 - h_offset
        mid_mountain.append((x, y))

    mid_poly = [(0, height)] + mid_mountain + [(width, height)]
    draw.polygon(mid_poly, fill=(102, 142, 175, 235))

    # -------------------------------------------------------------
    # 3. 원경 아파트 단지 및 고층 빌딩 숲 (Distant Apartment Clusters)
    # -------------------------------------------------------------
    # Divide horizon into neighborhood blocks with apartment clusters
    curr_x = 0
    while curr_x < width:
        # Determine whether this segment has dense apartments, low buildings, or park gap
        cluster_type = random.choice(['apt_dense', 'apt_tall', 'mid_rise', 'green_gap'])
        cluster_width = random.randint(45, 110)

        if cluster_type in ['apt_dense', 'apt_tall', 'mid_rise']:
            num_bldgs = random.randint(3, 8)
            bx = curr_x
            b_width = cluster_width // num_bldgs
            
            for b in range(num_bldgs):
                if cluster_type == 'apt_tall':
                    bh = random.randint(38, 72) # Tall apartment tower (25-35F)
                elif cluster_type == 'apt_dense':
                    bh = random.randint(28, 52) # Standard apartment slab (15-25F)
                else:
                    bh = random.randint(18, 35) # Mid-rise building

                by = horizon_y - bh + random.randint(-4, 4)
                bw = max(8, b_width - random.randint(1, 3))
                
                # Silhouette building body
                body_color = random.choice([
                    (88, 126, 158, 240),
                    (96, 134, 166, 245),
                    (80, 118, 150, 240)
                ])
                draw.rectangle([bx, by, bx + bw, horizon_y + 30], fill=body_color)
                
                # Rooftop machine room / elevator penthouse (아파트 옥탑 구조물)
                if bw >= 10:
                    ph_w = random.randint(4, max(5, bw - 4))
                    ph_h = random.randint(3, 7)
                    ph_x = bx + (bw - ph_w) // 2
                    draw.rectangle([ph_x, by - ph_h, ph_x + ph_w, by], fill=(75, 110, 140, 240))
                    
                    # Antenna / spire on some buildings (송전/통신 안테나)
                    if random.random() < 0.28:
                        spire_h = random.randint(6, 14)
                        draw.line([ph_x + ph_w // 2, by - ph_h, ph_x + ph_w // 2, by - ph_h - spire_h], fill=(65, 95, 125, 230), width=1)
                
                # Subtle window grid lights (은은한 창문 실루엣)
                if bh > 30 and bw > 12:
                    for wy in range(by + 6, horizon_y - 4, 6):
                        for wx in range(bx + 3, bx + bw - 3, 4):
                            if random.random() < 0.40:
                                draw.rectangle([wx, wy, wx + 1, wy + 2], fill=(240, 248, 255, 130))

                bx += b_width

        elif cluster_type == 'green_gap':
            # Forest / hill clump (도심 속 공원/녹지 구릉)
            clump_w = cluster_width
            clump_h = random.randint(14, 26)
            for cx in range(curr_x, curr_x + clump_w, 6):
                cy = horizon_y - clump_h + random.randint(-3, 3)
                cr = random.randint(7, 14)
                draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(82, 128, 132, 230))

        curr_x += cluster_width + random.randint(4, 12)

    # -------------------------------------------------------------
    # 4. 하단 공기원근법 안개 그라데이션 (Atmospheric Mist Blend)
    # -------------------------------------------------------------
    # Bottom fading so mountains and buildings blend naturally into ground
    mist = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mist_draw = ImageDraw.Draw(mist)
    
    # Soft mist from horizon_y - 10 to horizon_y + 35
    for y in range(horizon_y - 12, horizon_y + 45):
        if y < horizon_y:
            alpha = int(140 * ((y - (horizon_y - 12)) / 12.0))
        else:
            alpha = int(140 + 115 * ((y - horizon_y) / 45.0))
        alpha = max(0, min(255, alpha))
        mist_draw.line([(0, y), (width, y)], fill=(191, 230, 255, alpha))

    # Composite mist over horizon
    result = Image.alpha_composite(layer, mist)
    return result

if __name__ == '__main__':
    hl = generate_horizon_skyline()
    hl.save('D:/APT-Rank_Git/test_horizon_layer.png')
    print('Generated test_horizon_layer.png')
