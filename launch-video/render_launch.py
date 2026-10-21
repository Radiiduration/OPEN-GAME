#!/usr/bin/env python3
"""Render an original, brand-matched Open Game launch film frame stream."""

import argparse
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DURATION = 720, 1280, 30, 24
BG = (11, 14, 16)
PANEL = (17, 22, 24)
PANEL2 = (21, 27, 29)
LINE = (41, 50, 51)
TEXT = (238, 242, 233)
MUTED = (151, 163, 154)
LIME = (196, 241, 105)
TEAL = (114, 212, 208)
CORAL = (241, 138, 105)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_REG = "/System/Library/Fonts/Supplemental/Verdana.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Verdana Bold.ttf"
FONT_MONO = "/System/Library/Fonts/Supplemental/Andale Mono.ttf"


def font(size, bold=False, mono=False):
    path = FONT_MONO if mono else (FONT_BOLD if bold else FONT_REG)
    return ImageFont.truetype(path, size)


def make_background():
    yy, xx = np.mgrid[0:H, 0:W]
    nx = (xx - W * 0.5) / (W * 0.76)
    ny = (yy - H * 0.42) / (H * 0.68)
    glow = np.maximum(0.0, 1.0 - np.sqrt(nx * nx + ny * ny))
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    for i, base in enumerate(BG):
        tint = (12 if i == 1 else 7 if i == 2 else 0)
        arr[:, :, i] = np.clip(base + glow * tint, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


BASE = make_background()
SPHERE_CACHE = {}


def smooth(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def mix(a, b, p):
    p = smooth(p)
    return tuple(int(x + (y - x) * p) for x, y in zip(a, b))


def text(draw, xy, value, size, color=TEXT, bold=False, mono=False, anchor=None, spacing=8):
    draw.multiline_text(xy, value, font=font(size, bold, mono), fill=color, anchor=anchor, spacing=spacing, align="center" if anchor and "m" in anchor else "left")


def center(draw, y, value, size, color=TEXT, bold=False, mono=False, x=W / 2, spacing=8):
    text(draw, (x, y), value, size, color, bold, mono, "mm", spacing)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def glow_dot(im, x, y, r, color, alpha=120):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((x-r*3, y-r*3, x+r*3, y+r*3), fill=(*color, int(alpha * .28)))
    layer = layer.filter(ImageFilter.GaussianBlur(max(3, int(r * 1.5))))
    im.alpha_composite(layer)
    d = ImageDraw.Draw(im)
    d.ellipse((x-r, y-r, x+r, y+r), fill=(*color, 230))
    d.ellipse((x-r*.42, y-r*.42, x+r*.42, y+r*.42), fill=(255, 255, 255, 190))


def project(point, center_xy, camera=650):
    x, y, z = point
    factor = camera / (camera + z)
    return center_xy[0] + x * factor, center_xy[1] + y * factor


def rotate(point, yaw, pitch, roll=0):
    x, y, z = point
    cy, sy = math.cos(yaw), math.sin(yaw)
    x, z = x * cy - z * sy, x * sy + z * cy
    cp, sp = math.cos(pitch), math.sin(pitch)
    y, z = y * cp - z * sp, y * sp + z * cp
    cr, sr = math.cos(roll), math.sin(roll)
    x, y = x * cr - y * sr, x * sr + y * cr
    return x, y, z


def line_glow(im, points, color, width=2, alpha=100):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).line(points, fill=(*color, alpha), width=width + 7, joint="curve")
    layer = layer.filter(ImageFilter.GaussianBlur(8))
    im.alpha_composite(layer)
    ImageDraw.Draw(im).line(points, fill=(*color, 210), width=width, joint="curve")


def draw_logo(im, cx, cy, radius, angle=0, color=LIME, alpha=1.0):
    d = ImageDraw.Draw(im)
    color = tuple(int(c * alpha) for c in color)
    d.ellipse((cx-radius, cy-radius, cx+radius, cy+radius), outline=(*color, 230), width=max(2, int(radius * .07)))
    for i, height in enumerate((.32, .56, .40)):
        x = cx + (i - 1) * radius * .30
        top = cy + math.sin(angle + i * .4) * radius * .05 - radius * height / 2
        bottom = top + radius * height
        d.rounded_rectangle((x-radius*.045, top, x+radius*.045, bottom), radius=radius*.04, fill=(*color, 245))


def draw_orb(im, cx, cy, radius, t, emphasis=1.0):
    # A custom wireframe sphere with orthogonal orbit rings: a visual metaphor, not product UI.
    halo = Image.new("RGBA", im.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse((cx-radius*1.65, cy-radius*1.65, cx+radius*1.65, cy+radius*1.65), fill=(*TEAL, 16))
    im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(radius * .48)))
    material = SPHERE_CACHE.get(radius)
    if material is None:
        size = radius * 2 + 1
        yy, xx = np.mgrid[-radius:radius+1, -radius:radius+1].astype(np.float32)
        nx, ny = xx / radius, yy / radius
        rr = nx*nx + ny*ny
        inside = rr <= 1
        nz = np.sqrt(np.maximum(0, 1-rr))
        light = np.array([-0.48, -0.57, 0.67], dtype=np.float32)
        light /= np.linalg.norm(light)
        diffuse = np.maximum(0, nx*light[0] + ny*light[1] + nz*light[2])
        specular = np.maximum(0, nx*(-light[0]) + ny*(-light[1]) + nz*light[2]) ** 34
        rim = (1-nz) ** 3
        rgb = np.zeros((size, size, 3), dtype=np.uint8)
        rgb[:,:,0] = np.clip(12 + diffuse*13 + specular*80 + rim*13, 0, 255)
        rgb[:,:,1] = np.clip(17 + diffuse*30 + specular*116 + rim*25, 0, 255)
        rgb[:,:,2] = np.clip(19 + diffuse*40 + specular*132 + rim*33, 0, 255)
        alpha = np.where(inside, 232, 0).astype(np.uint8)
        material = Image.fromarray(np.dstack((rgb, alpha)), "RGBA")
        SPHERE_CACHE[radius] = material
    im.alpha_composite(material, (int(cx-radius), int(cy-radius)))
    cyaw = t * .28
    pitch = .46 + math.sin(t * .3) * .08
    center3 = (cx, cy)
    d = ImageDraw.Draw(im)
    # translucent depth shell
    d.ellipse((cx-radius*.94, cy-radius*.94, cx+radius*.94, cy+radius*.94), fill=(17, 22, 24, 100), outline=(*LINE, 180), width=2)
    for lat in (-1.08, -.72, -.36, 0, .36, .72, 1.08):
        points = []
        for j in range(73):
            lon = j * 2 * math.pi / 72
            p = (radius * math.cos(lat) * math.cos(lon), radius * math.sin(lat), radius * math.cos(lat) * math.sin(lon))
            points.append(project(rotate(p, cyaw, pitch), center3))
        col = TEAL if lat == 0 else LIME
        d.line(points, fill=(*col, 75 if lat else 150), width=1)
    for lon in np.linspace(0, 2 * math.pi, 9, endpoint=False):
        points = []
        for j in range(61):
            lat = -math.pi / 2 + j * math.pi / 60
            p = (radius * math.cos(lat) * math.cos(lon), radius * math.sin(lat), radius * math.cos(lat) * math.sin(lon))
            points.append(project(rotate(p, cyaw, pitch), center3))
        d.line(points, fill=(*LIME, 48 if int(lon*10) % 3 else 125), width=1)
    # 3D orbit circles in three planes
    for plane, col, offset in ((0, LIME, 0), (1, TEAL, 2.1), (2, CORAL, 4.0)):
        pts = []
        for j in range(97):
            a = j * 2 * math.pi / 96 + t * .26 + offset
            if plane == 0: p = (radius*1.32*math.cos(a), radius*.47*math.sin(a), 0)
            elif plane == 1: p = (0, radius*.48*math.sin(a), radius*1.30*math.cos(a))
            else: p = (radius*.87*math.cos(a), radius*.91*math.sin(a), radius*.75*math.cos(a))
            pts.append(project(rotate(p, cyaw, pitch), center3))
        d.line(pts, fill=(*col, 112 if plane != 0 else 155), width=2)
    # a few orbiting system nodes
    labels = [("WORLD", 0.15, CORAL), ("SYSTEMS", 2.25, LIME), ("STORY", 4.4, TEAL), ("PLAYER", 5.5, LIME)]
    for label, phase, col in labels:
        a = t * .43 + phase
        p = (radius*1.32*math.cos(a), radius*.55*math.sin(a), radius*.68*math.sin(a*1.3))
        px, py = project(rotate(p, cyaw, pitch), center3)
        r = max(4, radius*.034)
        glow_dot(im, int(px), int(py), int(r), col, int(95*emphasis))
        d = ImageDraw.Draw(im)
        label_font = font(max(10, int(radius*.072)), True, True)
        bb = d.textbbox((0, 0), label, font=label_font)
        label_w = bb[2]-bb[0]
        if px < cx:
            tx, anchor = px - label_w - 13, "r"
        else:
            tx, anchor = px + 13, "l"
        d.text((tx, py), label, font=label_font, fill=(*col, 235), anchor=f"{anchor}m")
    draw_logo(im, cx, cy, radius*.25, t*.15, LIME, emphasis)


def draw_grid(draw, t):
    spacing = 42
    offset = int(t * 18) % spacing
    for x in range(-spacing + offset, W, spacing):
        draw.line((x, 0, x, H), fill=(22, 29, 30), width=1)
    for y in range(-spacing + offset, H, spacing):
        draw.line((0, y, W, y), fill=(22, 29, 30), width=1)
    for y in range(offset, H, spacing):
        for x in range(offset, W, spacing):
            draw.ellipse((x-1, y-1, x+1, y+1), fill=(38, 48, 47))


def label(draw, y, value, color=LIME, x=52):
    text(draw, (x, y), value.upper(), 17, color, mono=True)


def card(draw, box, title, detail, accent=LIME, tag=None):
    rounded(draw, box, 16, (17, 22, 24, 238), (48, 59, 57, 255), 2)
    draw.rounded_rectangle((box[0], box[1], box[0]+5, box[3]), radius=2, fill=(*accent, 255))
    text(draw, (box[0]+22, box[1]+24), title, 21, TEXT, True)
    text(draw, (box[0]+22, box[1]+60), detail, 17, MUTED)
    if tag:
        text(draw, (box[2]-14, box[1]+18), tag.upper(), 13, accent, mono=True, anchor="ra")


def arrows(draw, x1, y1, x2, y2, color=LIME, phase=0):
    draw.line((x1, y1, x2, y2), fill=(*color, 200), width=3)
    a = math.atan2(y2-y1, x2-x1)
    length = 11
    p1 = (x2-length*math.cos(a-.55), y2-length*math.sin(a-.55))
    p2 = (x2-length*math.cos(a+.55), y2-length*math.sin(a+.55))
    draw.polygon(((x2,y2),p1,p2), fill=(*color,240))
    pulse = ((phase % 1) * .72 + .12)
    px, py = int(x1+(x2-x1)*pulse), int(y1+(y2-y1)*pulse)
    draw.ellipse((px-4, py-4, px+4, py+4), fill=(*color, 240))


def scene(im, t):
    draw = ImageDraw.Draw(im, "RGBA")
    draw_grid(draw, t)
    # moving left-edge locator and top technical readout
    draw.line((40, 95, 40, 1185), fill=(52, 64, 61, 140), width=1)
    draw.ellipse((35, 128 + int((t % 36) / 36 * 980), 45, 138 + int((t % 36) / 36 * 980)), fill=(*LIME, 190))
    text(draw, (52, 44), "OPEN GAME  /  CREATOR WORKFLOW", 13, MUTED, mono=True)
    text(draw, (665, 44), f"OG—01  /  {int(t*30):04d}", 13, MUTED, mono=True, anchor="ra")

    def footer(note):
        draw.line((52, 1190, 668, 1190), fill=(45, 54, 52, 210), width=1)
        text(draw, (52, 1210), note.upper(), 12, MUTED, mono=True)
        draw_logo(im, 651, 1216, 15, t*.2, LIME)

    if t < 4:
        p = smooth(t / 1.4)
        draw_orb(im, 360, 510, 190, t, p)
        center(draw, 820, "A GAME STARTS\nWITH A FEELING.", 44, TEXT, True, spacing=8)
        center(draw, 965, "YOUR IDEA. YOUR UNIVERSE.", 16, CORAL, mono=True)
        footer("YOUR WORLD  /  YOUR RULES  /  ORIGINAL BY DESIGN")
    elif t < 8:
        u = t - 4
        center(draw, 206, "YOUR CHARACTERS.\nYOUR WORLD.", 42, TEXT, True, spacing=7)
        center(draw, 342, "START WITH THE EXPERIENCE YOU WANT TO MAKE.", 14, MUTED, mono=True)
        draw_orb(im, 360, 660, 135, u, .8)
        # Honest conceptual input card using the real Studio field names.
        rounded(draw, (74, 890, 646, 1080), 18, (17,22,24,248), (57,66,60,255), 2)
        label(draw, 925, "CREATOR BRIEF  /  ORIGINAL INPUT", CORAL, 100)
        text(draw, (100, 968), "World, story & special rules", 23, TEXT, True)
        text(draw, (100, 1017), "Your characters  ·  target platform  ·  multiplayer", 15, MUTED)
        footer("OPEN GAME STUDIO  /  YOUR CREATIVE DIRECTION")
    elif t < 12:
        u = t - 8
        center(draw, 184, "THE BRIEF BECOMES\nA BUILD HANDOFF.", 39, TEXT, True)
        center(draw, 310, "STUDIO ORGANIZES THE VISION INTO A PROJECT CONTRACT.", 13, MUTED, mono=True)
        draw_orb(im, 360, 690, 145, u, 1)
        boxes = [(54, 850, 245, 967), (262, 850, 453, 967), (470, 850, 666, 967)]
        names = [("01  BRIEF", "Creator's idea", CORAL), ("02  SYSTEMS", "Connected plan", LIME), ("03  HANDOFF", "JSON blueprint", TEAL)]
        for i, (b, (name, detail, color)) in enumerate(zip(boxes, names)):
            card(draw, b, name, detail, color)
            if i < 2: arrows(draw, b[2]+5, 908, boxes[i+1][0]-8, 908, LIME, t*.35+i*.25)
        footer("BLUEPRINT  /  CHARACTER + WORLD CONTEXT  /  PROJECT FILES")
    elif t < 20:
        u = t - 12
        center(draw, 185, "THE CODING LLM\nWRITES THE GAME.", 42, TEXT, True)
        center(draw, 318, "OPEN GAME SUPPLIES THE WORKFLOW AND PROJECT CONTEXT.", 13, MUTED, mono=True)
        draw_orb(im, 360, 570, 110, u, 1)
        # Relationship map; labels match current tool names and roles.
        card(draw, (62, 760, 320, 870), "OPEN GAME", "Skill  ·  project core", LIME, "workflow")
        card(draw, (400, 760, 658, 870), "CODING LLM", "Authors game source", CORAL, "builder")
        arrows(draw, 323, 815, 395, 815, TEAL, t*.4)
        card(draw, (62, 915, 320, 1030), "MCP  +  CLI", "Plan  ·  inspect  ·  resume", TEAL)
        card(draw, (400, 915, 658, 1030), "ENGINE PROJECT", "Scenes  ·  gameplay  ·  UI", LIME)
        arrows(draw, 323, 973, 395, 973, LIME, t*.45+.3)
        center(draw, 1093, "THE CONNECTED AGENT AND ENGINE DO THE IMPLEMENTATION.", 12, MUTED, mono=True)
        footer("ILLUSTRATIVE WORKFLOW MAP  /  NOT A CAPTURED AGENT SESSION")
    elif t < 26:
        u = t - 20
        center(draw, 194, "BUILD. PLAY.\nCHECK. REPAIR.", 45, TEXT, True)
        center(draw, 331, "A PROJECT GROWS THROUGH VERIFIED ITERATIONS.", 14, MUTED, mono=True)
        draw_orb(im, 360, 640, 155, u, 1)
        items = [("IMPLEMENT", 360, 425, CORAL), ("BUILD", 540, 630, LIME), ("PLAY-CHECK", 360, 835, TEAL), ("REPAIR", 180, 630, LIME)]
        for i, (name, x, y, color) in enumerate(items):
            rounded(draw, (x-84, y-31, x+84, y+31), 25, (17,22,24,245), (*color, 220), 2)
            center(draw, y, name, 13, color, True, mono=True, x=x)
            nxt = items[(i+1) % len(items)]
            arrows(draw, int(x+(nxt[1]-x)*.35), int(y+(nxt[2]-y)*.35), int(nxt[1]-(nxt[1]-x)*.35), int(nxt[2]-(nxt[2]-y)*.35), color, t*.3+i*.24)
        footer("PROGRESS RECORD  /  PLAYABLE CHECKPOINTS  /  RESUME THE WORK")
    elif t < 30:
        u = t - 26
        center(draw, 200, "ONE INCLUDED\nPLAYABLE EXAMPLE.", 39, TEXT, True)
        center(draw, 333, "A BOUNDED ORIGINAL BROWSER-RACING ADAPTER.", 13, MUTED, mono=True)
        # A perspective racing ribbon is an illustrative abstraction for the bundled sample.
        horizon = 600
        draw.ellipse((270, 440, 450, 620), outline=(*LIME, 150), width=2)
        for k in range(8):
            yy = horizon + k*k*8 + int((u*90) % 70)
            if yy < 1080:
                width = 25 + int((yy-horizon)*.49)
                draw.line((360-width, yy, 360+width, yy), fill=(60, 78, 65, min(150, 50+k*13)), width=max(1, k))
        left, right = [], []
        for i in range(31):
            z = i / 30
            y = horizon + z*z*410
            width = 18 + z*270
            left.append((360-width, y)); right.append((360+width, y))
        draw.line(left, fill=(*TEAL, 200), width=3)
        draw.line(right, fill=(*TEAL, 200), width=3)
        # Moving lane markers imply forward motion without pretending to be a screenshot.
        for k in range(5):
            z = ((k/5 + (u*.55) % 1) % 1)
            y = horizon + z*z*410
            h = 3 + z*10
            draw.rounded_rectangle((356-h, y-h*2, 364+h, y+h*2), radius=3, fill=(*LIME, 220))
        rounded(draw, (104, 1040, 616, 1100), 28, (17,22,24,245), (*CORAL, 210), 2)
        center(draw, 1070, "WORKFLOW VISUALIZATION  ·  NOT A GAME CAPTURE", 12, CORAL, True, mono=True)
        footer("CURRENT EXAMPLE ADAPTER  /  OPEN GAME IS NOT A UNIVERSAL COMPILER")
    else:
        u = t - 30
        draw_orb(im, 360, 385, 120, u, .8)
        draw_logo(im, 360, 190, 45, u*.25, LIME)
        center(draw, 610, "YOUR BRIEF.\nYOUR LLM.\nYOUR GAME PROJECT.", 37, TEXT, True, spacing=9)
        center(draw, 795, "EXPLORE OPEN GAME", 17, LIME, True, mono=True)
        rounded(draw, (71, 838, 649, 914), 15, (21,27,29,245), (59,75,60,255), 2)
        center(draw, 876, "opengame-ecru.vercel.app", 19, TEXT, True, mono=True)
        rounded(draw, (71, 932, 649, 1008), 15, (21,27,29,245), (59,75,60,255), 2)
        center(draw, 970, "github.com/Radiiduration/OPEN-GAME", 14, TEXT, True, mono=True)
        center(draw, 1061, "THE CONNECTED CODING LLM IMPLEMENTS THE GAME.", 12, MUTED, mono=True)
        footer("VISIT THE SITE  /  EXPLORE THE OPEN GAME REPOSITORY")

    # Deliberate section label and restrained colored progress bar.
    section = min(5, int(t / 6))
    bar_x0, bar_x1, bar_y = 52, 668, 1168
    draw.rounded_rectangle((bar_x0, bar_y, bar_x1, bar_y+3), radius=2, fill=(37, 47, 46, 230))
    draw.rounded_rectangle((bar_x0, bar_y, bar_x0+(bar_x1-bar_x0)*((t % 36)/36), bar_y+3), radius=2, fill=(*LIME, 235))


def render_frame(t):
    im = BASE.convert("RGBA")
    # controlled vignette and drifting ambient specks
    # Compress the original storyboard to a punchier 24-second social cut.
    story_t = t * 1.5
    scene(im, story_t)
    # A restrained animated camera push gives the technical layers more depth.
    section_progress = (story_t % 6) / 6
    zoom = 1.0 + 0.025 * smooth(section_progress)
    zw, zh = int(W / zoom), int(H / zoom)
    left, top = (W - zw) // 2, (H - zh) // 2
    im = im.crop((left, top, left + zw, top + zh)).resize((W, H), Image.Resampling.LANCZOS)
    # section-specific entrance: quick luminous sweep on every 4-second boundary
    boundaries = [0, 4/1.5, 8/1.5, 12/1.5, 20/1.5, 26/1.5, 30/1.5]
    transition_age = min((t - b) for b in boundaries if t >= b)
    if transition_age < .18:
        alpha = int(105 * (1 - transition_age/.18))
        overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        y = int((1-transition_age/.18)*H)
        od.line((0, y, W, y-120), fill=(*LIME, alpha), width=5)
        im.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(10)))
    return im.convert("RGB")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=float, default=0)
    parser.add_argument("--end", type=float, default=DURATION)
    parser.add_argument("--fps", type=int, default=FPS)
    args = parser.parse_args()
    total = round((args.end - args.start) * args.fps)
    for i in range(total):
        t = args.start + i / args.fps
        frame = render_frame(t)
        sys.stdout.buffer.write(frame.tobytes())
        if i % (args.fps * 3) == 0:
            sys.stderr.write(f"rendered {t:05.1f}s / {args.end:.1f}s\n")
            sys.stderr.flush()
    sys.stdout.buffer.flush()


if __name__ == "__main__":
    main()
