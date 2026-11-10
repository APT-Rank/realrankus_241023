import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

def generate_horizon_skyline_layer(width=2048, height=1024, horizon_y=520, is_summer=True):
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    random.seed(101) # Consistent seed for picturesque distant Seoul vista

    # -----------------------------------------------------------------
    # 1. Far High Mountain Ridge (원경 고산맥 - 1/2 크기로 축소하여 원근감 강화)
    # -----------------------------------------------------------------
    far_mountain = []
    for x in range(0, width + 1, 3):
        nx = x / float(width) * 2 * math.pi
        # Multi-octave natural ridge (scaled by 0.5)
        h_offset = (
            math.sin(nx * 3.0 + 0.4) * 26 +
            math.sin(nx * 6.0 + 1.8) * 14 +
            math.sin(nx * 12.0 + 3.2) * 8 +
            math.cos(nx * 24.0) * 4
        )
        # Distinct mountain peaks (scaled by 0.5)
        if 0.12 < (x / width) < 0.38:
            peak = math.sin((x / width - 0.12) / 0.26 * math.pi) * 22
            h_offset += peak
        if 0.60 < (x / width) < 0.88:
            peak = math.sin((x / width - 0.60) / 0.28 * math.pi) * 20
            h_offset += peak

        y = horizon_y - 18 - h_offset
        far_mountain.append((x, y))

    far_poly = [(0, height)] + far_mountain + [(width, height)]
    far_color = (135, 175, 210, 220) if is_summer else (145, 125, 160, 210)
    draw.polygon(far_poly, fill=far_color)

    # -----------------------------------------------------------------
    # 2. Mid Mountain Ridge (중경 구릉 및 숲 능선 - 1/2 크기 축소)
    # -----------------------------------------------------------------
    mid_mountain = []
    for x in range(0, width + 1, 3):
        nx = x / float(width) * 2 * math.pi
        h_offset = (
            math.sin(nx * 4.0 + 1.2) * 18 +
            math.cos(nx * 8.0 + 2.5) * 10 +
            math.sin(nx * 16.0 + 0.7) * 5
        )
        y = horizon_y - 9 - h_offset
        mid_mountain.append((x, y))

    mid_poly = [(0, height)] + mid_mountain + [(width, height)]
    mid_color = (95, 142, 175, 230) if is_summer else (115, 95, 135, 220)
    draw.polygon(mid_poly, fill=mid_color)

    # -----------------------------------------------------------------
    # 3. Distant Apartment Clusters (원경 아파트 단지 - 1/2 크기 축소)
    # -----------------------------------------------------------------
    curr_x = 0
    while curr_x < width:
        cluster_type = random.choice(['apt_dense', 'apt_tall', 'apt_cluster', 'green_hill'])
        cluster_width = random.randint(30, 70) # 1/2 cluster width

        if cluster_type in ['apt_dense', 'apt_tall', 'apt_cluster']:
            num_bldgs = random.randint(5, 10)
            bx = curr_x
            b_width = max(4, cluster_width // num_bldgs) # 4~8px wide buildings

            for b in range(num_bldgs):
                if cluster_type == 'apt_tall':
                    bh = random.randint(20, 38) # Tall apartment tower (1/2 scale)
                elif cluster_type == 'apt_dense':
                    bh = random.randint(14, 27) # Standard apartment slab (1/2 scale)
                else:
                    bh = random.randint(10, 20) # Mid-rise building (1/2 scale)

                by = horizon_y - bh + random.randint(-2, 2)
                bw = max(4, b_width - random.randint(0, 2))

                # Light grayscale apartment silhouettes (연한 그레이스케일 아파트 실루엣)
                body_color = random.choice([
                    (185, 185, 185, 230),
                    (200, 200, 200, 235),
                    (175, 175, 175, 230)
                ])

                draw.rectangle([bx, by, bx + bw, horizon_y + 30], fill=body_color)

                # Rooftop machine rooms & water tank penthouses (1/2 scale light gray)
                if bw >= 5:
                    ph_w = random.randint(2, max(3, bw - 2))
                    ph_h = random.randint(2, 4)
                    ph_x = bx + (bw - ph_w) // 2
                    penthouse_color = (160, 160, 160, 230)
                    draw.rectangle([ph_x, by - ph_h, ph_x + ph_w, by], fill=penthouse_color)

                    # Rooftop antenna / spire (1/2 scale light gray)
                    if random.random() < 0.35:
                        spire_h = random.randint(4, 9)
                        spire_color = (145, 145, 145, 210)
                        draw.line([ph_x + ph_w // 2, by - ph_h, ph_x + ph_w // 2, by - ph_h - spire_h], fill=spire_color, width=1)

                # Tiny window lights (1x1 px soft white)
                if bh > 16 and bw > 5:
                    for wy in range(by + 4, horizon_y - 2, 4):
                        for wx in range(bx + 2, bx + bw - 2, 3):
                            if random.random() < 0.35:
                                win_color = (255, 255, 255, 150)
                                draw.point((wx, wy), fill=win_color)

                bx += b_width

        elif cluster_type == 'green_hill':
            # Forest hill / urban park clump (1/2 scale)
            clump_w = cluster_width
            clump_h = random.randint(9, 17)
            hill_color = (72, 125, 128, 230) if is_summer else (85, 105, 108, 230)
            for cx in range(curr_x, curr_x + clump_w, 4):
                cy = horizon_y - clump_h + random.randint(-2, 2)
                cr = random.randint(5, 9)
                draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=hill_color)

        curr_x += cluster_width + random.randint(2, 8)

    # -----------------------------------------------------------------
    # 4. Atmospheric Perspective Mist Gradient (부드러운 하단 연무)
    # -----------------------------------------------------------------
    mist = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mist_draw = ImageDraw.Draw(mist)
    fog_rgb = (191, 230, 255) if is_summer else (251, 207, 232)
    
    for y in range(horizon_y - 8, horizon_y + 40):
        if y < horizon_y:
            alpha = int(110 * ((y - (horizon_y - 8)) / 8.0))
        else:
            alpha = int(110 + 145 * ((y - horizon_y) / 40.0))
        alpha = max(0, min(255, alpha))
        mist_draw.line([(0, y), (width, y)], fill=(fog_rgb[0], fog_rgb[1], fog_rgb[2], alpha))

    result = Image.alpha_composite(layer, mist)
    return result

def make_skydome_panorama(ref_path, out_path, is_summer=True, width=2048, height=1024):
    ref = Image.open(ref_path).convert("RGBA")
    rw, rh = ref.size
    
    pano = Image.new("RGBA", (width, height), (15, 60, 120, 255))
    
    # 1. 360 Base Gradient
    for y in range(height):
        t = y / float(height)
        if is_summer:
            if t < 0.5:
                st = t / 0.5
                if st < 0.65:
                    k = st / 0.65
                    r = int(13 * (1 - k) + 41 * k)
                    g = int(61 * (1 - k) + 128 * k)
                    b = int(130 * (1 - k) + 185 * k)
                else:
                    k = (st - 0.65) / 0.35
                    r = int(41 * (1 - k) + 191 * k)
                    g = int(128 * (1 - k) + 230 * k)
                    b = int(185 * (1 - k) + 255 * k)
            else:
                st = (t - 0.5) / 0.5
                r = int(191 * (1 - st) + 215 * st)
                g = int(230 * (1 - st) + 240 * st)
                b = int(255 * (1 - st) + 255 * st)
        else:
            if t < 0.5:
                st = t / 0.5
                if st < 0.7:
                    k = st / 0.7
                    r = int(16 * (1 - k) + 28 * k)
                    g = int(36 * (1 - k) + 72 * k)
                    b = int(65 * (1 - k) + 115 * k)
                else:
                    k = (st - 0.7) / 0.3
                    r = int(28 * (1 - k) + 245 * k)
                    g = int(72 * (1 - k) + 165 * k)
                    b = int(115 * (1 - k) + 155 * k)
            else:
                st = (t - 0.5) / 0.5
                r = int(245 * (1 - st) + 191 * st)
                g = int(165 * (1 - st) + 230 * st)
                b = int(155 * (1 - st) + 255 * st)
                
        for x in range(width):
            pano.putpixel((x, y), (r, g, b, 255))
            
    # 2. Paste towering cumulus cloud artwork
    cut_bottom_h = int(rh * 0.86)
    cropped_ref = ref.crop((0, 0, rw, cut_bottom_h))
    
    target_w = int(width * 0.88)
    target_h = int(target_w * (cut_bottom_h / float(rw)))
    resized_ref = cropped_ref.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    paste_x = (width - target_w) // 2
    paste_y = int(height * 0.515) - target_h
    
    mask = Image.new("L", (target_w, target_h), 255)
    mw, mh = mask.size
    fade_x = int(mw * 0.16)
    fade_y = int(mh * 0.12)
    
    for y in range(mh):
        for x in range(mw):
            alpha = 255
            if x < fade_x:
                alpha = min(alpha, int(255 * (x / float(fade_x))))
            elif x > mw - fade_x:
                alpha = min(alpha, int(255 * ((mw - x) / float(fade_x))))
            if y < fade_y:
                alpha = min(alpha, int(255 * (y / float(fade_y))))
            mask.putpixel((x, y), alpha)
            
    pano.paste(resized_ref, (paste_x, paste_y), mask)
    
    # 3. Overlay the refined 1/2 scale mountain ridges & apartment skyline
    horizon_layer = generate_horizon_skyline_layer(width, height, horizon_y=520, is_summer=is_summer)
    pano = Image.alpha_composite(pano, horizon_layer)
    
    final_pano = pano.convert("RGB")
    final_pano.save(out_path, quality=95)
    print(f"Generated skydome panorama with half-scale mountain & apartment horizon: {out_path} ({width}x{height})")

if __name__ == "__main__":
    summer_ref = r"D:\APT-Rank_Git\assets\images\shinkai_early_summer_sky.jpg"
    summer_out = r"D:\APT-Rank_Git\assets\images\shinkai_skydome_summer_2048.jpg"
    make_skydome_panorama(summer_ref, summer_out, is_summer=True)
