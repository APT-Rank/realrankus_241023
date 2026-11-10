import math
import random
from PIL import Image, ImageDraw, ImageFilter

def draw_modular_tile(tile_type, tile_w, tile_h, greens, road_color, curb_color, seed=42):
    """
    Renders one modular tile with standardized road connections at:
    - Top: (cx, 0)
    - Bottom: (cx, tile_h)
    - Left: (0, cy)
    - Right: (tile_w, cy)
    Road width is proportional to tile size.
    """
    random.seed(seed)
    img = Image.new("RGBA", (tile_w, tile_h), (241, 245, 249, 255))
    draw = ImageDraw.Draw(img)

    road_w = max(14, int(tile_w * 0.12)) # Road width proportional to tile size
    half_r = road_w // 2
    cx = tile_w // 2
    cy = tile_h // 2

    # Base warm yellow-green background (연두색)
    bg_green = greens[tile_type % len(greens)]
    draw.rectangle([0, 0, tile_w, tile_h], fill=bg_green)

    # All tiles share standardized road entry/exit points at (cx, 0), (cx, tile_h), (0, cy), (tile_w, cy)
    if tile_type == 0:
        # Tile 0: 4-Way Cross Intersection with 4 sub-parcels
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        margin = max(4, int(tile_w * 0.04))
        for px1, py1, px2, py2, g_c in [
            (margin, margin, cx - half_r - margin, cy - half_r - margin, greens[0]),
            (cx + half_r + margin, margin, tile_w - margin, cy - half_r - margin, greens[1]),
            (margin, cy + half_r + margin, cx - half_r - margin, tile_h - margin, greens[2]),
            (cx + half_r + margin, cy + half_r + margin, tile_w - margin, tile_h - margin, greens[3])
        ]:
            draw.rectangle([px1, py1, px2, py2], fill=curb_color)
            pad = max(2, margin // 2)
            draw.rectangle([px1 + pad, py1 + pad, px2 - pad, py2 - pad], fill=g_c)

    elif tile_type == 1:
        # Tile 1: Central Roundabout
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        rb_radius = int(tile_w * 0.30)
        draw.ellipse([cx - rb_radius, cy - rb_radius, cx + rb_radius, cy + rb_radius], fill=road_color)
        island_r = int(rb_radius * 0.58)
        draw.ellipse([cx - island_r, cy - island_r, cx + island_r, cy + island_r], fill=curb_color)
        draw.ellipse([cx - island_r + 3, cy - island_r + 3, cx + island_r - 3, cy + island_r - 3], fill=greens[0])

    elif tile_type == 2:
        # Tile 2: Dual Horizontal Bypass with Vertical Connector
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        sub_y = int(tile_h * 0.22)
        draw.rectangle([0, sub_y - half_r // 2, tile_w, sub_y + half_r // 2], fill=road_color)
        m = max(4, int(tile_w * 0.04))
        draw.rectangle([m, int(tile_h * 0.28), cx - half_r - m, cy - half_r - m], fill=greens[4])
        draw.rectangle([cx + half_r + m, int(tile_h * 0.28), tile_w - m, cy - half_r - m], fill=greens[1])

    elif tile_type == 3:
        # Tile 3: Open Warm Yellow-Green Meadow (넓은 화사한 연두빛 광장 평지)
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        m = max(4, int(tile_w * 0.04))
        draw.rectangle([cx + half_r + m, m, tile_w - m, tile_h - m], fill=curb_color)
        draw.rectangle([cx + half_r + m + 3, m + 3, tile_w - m - 3, tile_h - m - 3], fill=greens[0])
        # Walking diagonal trail
        draw.line([(cx + half_r + m + 8, m + 8), (tile_w - m - 8, tile_h - m - 8)], fill=(255, 255, 255, 220), width=max(2, int(road_w * 0.15)))

    elif tile_type == 4:
        # Tile 4: Crossroads with Organic Curved Yellow-Green Quadrants
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        m = max(4, int(tile_w * 0.04))
        draw.ellipse([m, m, cx - half_r - m, cy - half_r - m], fill=greens[3])
        draw.rectangle([cx + half_r + m, m, tile_w - m, cy - half_r - m], fill=greens[2])
        draw.rectangle([m, cy + half_r + m, cx - half_r - m, tile_h - m], fill=greens[1])
        draw.ellipse([cx + half_r + m, cy + half_r + m, tile_w - m, tile_h - m], fill=greens[0])

    elif tile_type == 5:
        # Tile 5: Meandering Pedestrian Walkway across Roads
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        m = max(4, int(tile_w * 0.04))
        draw.rectangle([m, m, cx - half_r - m, cy - half_r - m], fill=greens[4])
        draw.rectangle([cx + half_r + m, m, tile_w - m, cy - half_r - m], fill=greens[0])
        draw.rectangle([m, cy + half_r + m, cx - half_r - m, tile_h - m], fill=greens[3])
        draw.rectangle([cx + half_r + m, cy + half_r + m, tile_w - m, tile_h - m], fill=greens[2])

    elif tile_type == 6:
        # Tile 6: 3-Way Fork with Slanted Yellow-Green Wedges (사선 분할 연두빛 필지)
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        draw.line([(0, cy), (cx, 0)], fill=road_color, width=road_w)
        m = max(4, int(tile_w * 0.04))
        draw.polygon([(m, m), (cx - half_r - m, m), (m, cy - half_r - m)], fill=greens[1])
        draw.rectangle([cx + half_r + m, m, tile_w - m, cy - half_r - m], fill=greens[0])
        draw.rectangle([m, cy + half_r + m, tile_w - m, tile_h - m], fill=greens[2])

    elif tile_type == 7:
        # Tile 7: Twin Boulevards with Central Linear Yellow-Green Park
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        linear_w = int(road_w * 0.45)
        m = max(4, int(tile_w * 0.04))
        draw.rectangle([cx - linear_w // 2, m, cx + linear_w // 2, tile_h - m], fill=curb_color)
        draw.rectangle([cx - linear_w // 2 + 2, m + 2, cx + linear_w // 2 - 2, tile_h - m - 2], fill=greens[0])
        draw.rectangle([m, m, cx - half_r - m, cy - half_r - m], fill=greens[3])
        draw.rectangle([cx + half_r + m, m, tile_w - m, cy - half_r - m], fill=greens[4])
        draw.rectangle([m, cy + half_r + m, cx - half_r - m, tile_h - m], fill=greens[2])
        draw.rectangle([cx + half_r + m, cy + half_r + m, tile_w - m, tile_h - m], fill=greens[1])

    else:
        # Tile 8: Residential Block with Cul-de-sac & Corner Greens
        draw.rectangle([cx - half_r, 0, cx + half_r, tile_h], fill=road_color)
        draw.rectangle([0, cy - half_r, tile_w, cy + half_r], fill=road_color)
        loop_r = int(road_w * 0.75)
        draw.ellipse([cx // 2 - loop_r, cy // 2 - loop_r, cx // 2 + loop_r, cy // 2 + loop_r], fill=road_color)
        draw.ellipse([cx // 2 - loop_r + 3, cy // 2 - loop_r + 3, cx // 2 + loop_r - 3, cy // 2 + loop_r - 3], fill=greens[0])
        m = max(4, int(tile_w * 0.04))
        draw.rectangle([cx + half_r + m, m, tile_w - m, cy - half_r - m], fill=greens[2])
        draw.rectangle([m, cy + half_r + m, cx - half_r - m, tile_h - m], fill=greens[4])
        draw.rectangle([cx + half_r + m, cy + half_r + m, tile_w - m, tile_h - m], fill=greens[3])

    # White lane center markings
    dash_len = max(6, int(tile_w * 0.035))
    gap_len = dash_len
    line_w = max(1, int(road_w * 0.05))
    for y_pos in range(0, tile_h, dash_len + gap_len):
        draw.line([(cx, y_pos), (cx, y_pos + dash_len)], fill=(255, 255, 255, 210), width=line_w)
    for x_pos in range(0, tile_w, dash_len + gap_len):
        draw.line([(x_pos, cy), (x_pos + dash_len, cy)], fill=(255, 255, 255, 210), width=line_w)

    # Warm anime tree dots along road curbs (NO MINT, warm leafy olive/lime)
    for _ in range(random.randint(3, 7)):
        rx = random.choice([cx - half_r - 5, cx + half_r + 5, random.randint(10, tile_w - 10)])
        ry = random.choice([cy - half_r - 5, cy + half_r + 5, random.randint(10, tile_h - 10)])
        tr = random.randint(max(2, int(tile_w * 0.015)), max(5, int(tile_w * 0.030)))
        draw.ellipse([rx - tr + 1, ry - tr + 1, rx + tr + 1, ry + tr + 1], fill=(71, 85, 105, 50))
        # Warm leafy grass-green foliage (싱그러운 초록 수목)
        draw.ellipse([rx - tr, ry - tr, rx + tr, ry + tr], fill=(38, 158, 58, 230))
        draw.ellipse([rx - tr + 1, ry - tr + 1, rx + tr - 1, ry + tr - 1], fill=(74, 198, 86, 240))

    return img

def create_fine_interconnected_ground(grid_n=12, total_size=2048):
    """
    Creates a 12x12 (or finer) interconnected modular ground texture.
    - Zero mint tint: 100% warm, lush anime yellow-green (연두색 / 라임 계열).
    - Tile size reduced further to ~161m in 3D scale (12x12 grid = 144 blocks).
    - Perfect seamless toroidal connectivity.
    """
    tile_w = 256
    tile_h = 256
    grid_res = grid_n * tile_w # 12 * 256 = 3072x3072 supersampled
    master = Image.new("RGBA", (grid_res, grid_res), (241, 245, 249, 255))

    road_color = (203, 213, 225, 255) # Clean anime warm slate asphalt
    curb_color = (248, 250, 252, 255) # Off-white curb
    
    # 100% 싱그럽고 화사한 잔디 초록색 (Grass Green) 파레트
    greens = [
        (74, 198, 86, 255),   # #4ac656 (싱그러운 봄잔디 초록)
        (92, 210, 104, 255),  # #5cd268 (햇살 가득한 잔디 초록)
        (58, 182, 78, 255),   # #3ab64e (깊이감 있는 도심 공원 초록)
        (108, 220, 118, 255), # #6cdc76 (화사한 잔디 초록)
        (80, 192, 95, 255)    # #50c05f (정갈한 에메랄드 잔디 초록)
    ]

    for row in range(grid_n):
        for col in range(grid_n):
            # Non-repeating distribution across 144 blocks
            tile_type = (row * 2 + col * 3) % 9
            seed = 2000 + row * 15 + col
            t_img = draw_modular_tile(tile_type, tile_w, tile_h, greens, road_color, curb_color, seed=seed)
            master.paste(t_img, (col * tile_w, row * tile_h))

    # High quality Lanczos downscaling to 2048x2048
    final_img = master.resize((total_size, total_size), Image.Resampling.LANCZOS)
    return final_img

def apply_radial_feathering(im, out_path):
    w, h = im.size
    vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)
    
    cx, cy = w / 2.0, h / 2.0
    r_inner = float(w) * 0.38
    r_outer = float(w) * 0.495
    fog_color = (191, 230, 255) # #bfe6ff (Matches horizon fog)
    span = r_outer - r_inner
    
    for r in range(int(r_inner), int(r_outer) + 2):
        t = max(0.0, min(1.0, (float(r) - r_inner) / span))
        alpha = int(255 * (t ** 2))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(fog_color[0], fog_color[1], fog_color[2], alpha), width=3)
        
    for r in range(int(r_outer), int(w * 0.72)):
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(fog_color[0], fog_color[1], fog_color[2], 255), width=3)
        
    res = Image.alpha_composite(im.convert("RGBA"), vignette)
    final = res.convert("RGB")
    final.save(out_path, quality=95)
    print(f"Feathered modular ground saved: {out_path} ({w}x{h})")

if __name__ == '__main__':
    raw_ground = create_fine_interconnected_ground(grid_n=12, total_size=2048)
    out_raw = r"D:\APT-Rank_Git\assets\images\shinkai_9tile_modular_ground.jpg"
    raw_ground.convert("RGB").save(out_raw, quality=95)
    print(f"Generated 12x12 fine modular ground (Pure Yellow-Green): {out_raw}")

    out_feathered = r"D:\APT-Rank_Git\assets\images\shinkai_9tile_modular_ground_feathered.jpg"
    apply_radial_feathering(raw_ground, out_feathered)
