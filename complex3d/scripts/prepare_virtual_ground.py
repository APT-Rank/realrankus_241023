from PIL import Image, ImageDraw

def prepare_virtual_ground(in_path, out_path):
    im = Image.open(in_path).convert("RGBA")
    w, h = im.size
    
    # Create radial vignette layer
    vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)
    
    cx, cy = w / 2.0, h / 2.0
    r_inner = float(w) * 0.38 # Inside 38% radius: 100% crisp artwork
    r_outer = float(w) * 0.495 # Outer edge: blends into horizon fog #bfe6ff
    
    fog_color = (191, 230, 255) # #bfe6ff
    span = r_outer - r_inner
    
    for r in range(int(r_inner), int(r_outer) + 2):
        t = max(0.0, min(1.0, (float(r) - r_inner) / span))
        alpha = int(255 * (t ** 2))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(fog_color[0], fog_color[1], fog_color[2], alpha), width=3)
        
    for r in range(int(r_outer), int(w * 0.72)):
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(fog_color[0], fog_color[1], fog_color[2], 255), width=3)
        
    res = Image.alpha_composite(im, vignette)
    final = res.convert("RGB")
    final.save(out_path, quality=95)
    print(f"Prepared feathered virtual ground: {out_path} ({w}x{h})")

if __name__ == '__main__':
    inp = r"D:\APT-Rank_Git\assets\images\shinkai_virtual_ground.jpg"
    out = r"D:\APT-Rank_Git\assets\images\shinkai_virtual_ground_feathered.jpg"
    prepare_virtual_ground(inp, out)
