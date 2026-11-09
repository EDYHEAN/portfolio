# Les illustrations 3D des « Features clés » (Johan, 06/11 : les captures n'apportaient rien) : de petites scènes en pâte
# à modeler douce, aux couleurs du projet, rendues au format de leur tuile du bento.
#   blender -b --factory-startup -P scripts/blender/make-features.py -- vinyl-run [nom…] [--glb-only]
# Écrit assets/<projet>/features3d/<nom>.glb (le modèle, animé en temps réel dans la tuile : src/feature3d.js) et
# <nom>.webp (l'affiche transparente : avant le chargement, et sans WebGL). Modélisation 100 % procédurale.
import bpy, bmesh, math, os, re, sys
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
GLB_ONLY = '--glb-only' in ARGS          # exporter les modèles sans refaire les rendus (affiches)
ARGS = [a for a in ARGS if not a.startswith('--')]
PROJECT = ARGS[0] if ARGS else 'vinyl-run'
ONLY = set(ARGS[1:])
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', PROJECT, 'features3d')
os.makedirs(OUT, exist_ok=True)

# Formats des tuiles (taille du bento -> pixels) : le sujet reste au centre, la tuile recadre en « cover ».
SIZES = {'l': (1200, 1000), 'w': (1500, 700), 't': (760, 1200), 's': (960, 760)}


def lin(hexstr):
    """#RRGGBB sRGB -> couleur linéaire (Blender travaille en linéaire)."""
    h = hexstr.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1,)


_mats = {}
def clay(hexstr, rough=0.55, coat=0.15):
    key = (hexstr, rough, coat)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new('clay' + hexstr)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = lin(hexstr)
    p.inputs['Roughness'].default_value = rough
    for name, v in (('Coat Weight', coat), ('Coat Roughness', 0.35), ('Subsurface Weight', 0.04)):
        if name in p.inputs:
            p.inputs[name].default_value = v
    _mats[key] = m
    return m


def finish(o, color, bevel=0.0, seg=4, rough=0.55):
    o.data.materials.append(clay(color, rough))
    for poly in o.data.polygons:
        poly.use_smooth = True
    if bevel > 0:
        b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = seg; b.limit_method = 'ANGLE'
        b.harden_normals = False
    return o


def link(o):
    bpy.context.collection.objects.link(o)
    return o


def rbox(sx, sy, sz, loc, color, rot=(0, 0, 0), bevel=0.06):
    me = bpy.data.meshes.new('box'); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('box', me))
    o.scale = (sx, sy, sz); o.location = loc; o.rotation_euler = rot
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.select_set(False)
    return finish(o, color, bevel=min(bevel, min(sx, sy, sz) * 0.45))


def cyl(r, h, loc, color, rot=(0, 0, 0), verts=64, bevel=0.02, r2=None):
    me = bpy.data.meshes.new('cyl'); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('cyl', me)); o.location = loc; o.rotation_euler = rot
    return finish(o, color, bevel=bevel)


def sphere(r, loc, color, scale=(1, 1, 1)):
    me = bpy.data.meshes.new('sph'); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=r); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('sph', me)); o.location = loc; o.scale = scale
    return finish(o, color)


def torus(R, r, loc, color, rot=(0, 0, 0), arc=360.0, start=0.0):
    me = bpy.data.meshes.new('tor'); bm = bmesh.new()
    n, m = 96, 24
    rings = []
    steps = n if arc >= 360 else n + 1
    for i in range(steps):
        a = math.radians(start) + math.radians(arc) * i / n
        ring = []
        for j in range(m):
            b = 2 * math.pi * j / m
            ring.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        rings.append(ring)
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if arc >= 360 else [])
    for A, B in pairs:
        for j in range(m):
            bm.faces.new((A[j], A[(j + 1) % m], B[(j + 1) % m], B[j]))
    if arc < 360:
        bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('tor', me)); o.location = loc; o.rotation_euler = rot
    return finish(o, color)


def blob(radius, depth, loc, color, wobble, seed=0, bevel=0.03):
    """Une galette au contour irrégulier (île, couche de relief)."""
    me = bpy.data.meshes.new('blob'); bm = bmesh.new()
    pts = []
    for i in range(72):
        a = 2 * math.pi * i / 72
        k = 1 + sum(w * math.sin(f * a + seed * (j + 1)) for j, (f, w) in enumerate(wobble))
        pts.append(bm.verts.new((radius * 1.18 * k * math.cos(a), radius * 0.86 * k * math.sin(a), 0)))
    face = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, vec=(0, 0, depth), verts=[v for v in ext['geom'] if isinstance(v, bmesh.types.BMVert)])
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('blob', me)); o.location = loc
    return finish(o, color, bevel=bevel, seg=3)


def scene(bg, size, cam_loc, target, lens=50, key=(-4, -5, 7), key_power=900, ambient=0.55, back=0.35):
    """Vide la scène, pose le sol (couleur de la tuile), la lumière de studio et la caméra."""
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene
    try: sc.render.engine = 'CYCLES'
    except TypeError: pass
    sc.cycles.samples = 64
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = SIZES[size]
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.quality = 86
    # Fond transparent + sol attrape-ombres : l'objet et son ombre se posent sur la couleur de la tuile, quelle qu'elle soit.
    sc.render.film_transparent = True
    world = sc.world or bpy.data.worlds.new('w'); sc.world = world
    world.use_nodes = True
    bgn = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bgn.inputs['Color'].default_value = lin(bg); bgn.inputs['Strength'].default_value = ambient
    ground = rbox(80, 80, 0.2, (0, 0, -0.1), bg, bevel=0)
    ground.data.materials[0] = clay(bg, rough=0.9, coat=0)
    ground.is_shadow_catcher = True
    ground.name = 'ground'
    for loc, power, size_l in ((key, key_power, 5), ((6, -3, 4), key_power * 0.28, 6), ((0, 6, 5), key_power * back, 5)):
        if power <= 0:
            continue
        ld = bpy.data.lights.new('l', 'AREA'); ld.energy = power; ld.size = size_l
        lo = link(bpy.data.objects.new('l', ld)); lo.location = loc
        lo.rotation_euler = (Vector(loc) - Vector(target)).to_track_quat('Z', 'Y').to_euler()
    cd = bpy.data.cameras.new('c'); cd.lens = lens
    co = link(bpy.data.objects.new('c', cd)); co.location = cam_loc
    co.rotation_euler = (Vector(cam_loc) - Vector(target)).to_track_quat('Z', 'Y').to_euler()
    sc.camera = co


def render(name):
    # Le modèle seul (sans sol ni lumières), centré, en GLB Draco : three.js l'éclaire et l'anime dans la tuile.
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'ground']
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    glb = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7)
    print('modèle', glb, round(os.path.getsize(glb) / 1024), 'Ko')
    if GLB_ONLY:
        return
    path = os.path.join(OUT, name + '.webp')
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print('rendu', path)


# --------------------------------------------------------------------------------------------------------------------
# Vinyl Run : nuit, crème pochette, néon jaune.
VR = {'bg': '#1b1b19', 'cream': '#f0ede6', 'neon': '#EDF10C', 'ink': '#141413', 'grey': '#5d5c57', 'red': '#c9472e'}


def vr_map():
    # La Réunion en courbes de niveau : des galettes empilées qui rétrécissent, le Piton au milieu, l'épingle sur Saint-Pierre.
    scene(VR['bg'], 'l', (0, -5.6, 5.0), (0, 0.15, 0.55), lens=45)
    wob = [(2, 0.06), (3, 0.08), (5, 0.04), (7, 0.025)]
    blob(2.7, 0.06, (0, 0, 0), '#2a2a27', wob, seed=0.4, bevel=0.02)   # le lagon
    for i in range(6):
        r = 2.2 * (1 - i * 0.15)
        blob(r, 0.2, (0.1 * i, 0.06 * i, 0.06 + i * 0.2), VR['cream'] if i % 2 == 0 else '#d9d4c7', wob, seed=1.3 + i * 0.37)
    # l'épingle : tige noire, tête néon
    cyl(0.045, 1.1, (-0.9, -1.0, 0.85), VR['ink'], bevel=0.01)
    sphere(0.26, (-0.9, -1.0, 1.45), VR['neon'])
    render('map')


def vr_chat():
    # Deux bulles : la question du visiteur (crème), la réponse du disquaire (néon) avec ses trois points.
    scene(VR['bg'], 't', (0, -9.2, 3.0), (0, 0, 1.35), lens=50)
    rbox(2.0, 0.5, 1.1, (-0.45, 0, 2.2), VR['cream'], bevel=0.42)
    cyl(0.26, 0.5, (-1.05, 0, 1.52), VR['cream'], rot=(math.radians(180), math.radians(-18), 0), verts=32, bevel=0.03, r2=0.0)
    rbox(1.9, 0.5, 1.0, (0.5, -0.2, 0.85), VR['neon'], bevel=0.42)
    cyl(0.24, 0.45, (1.05, -0.2, 0.2), VR['neon'], rot=(math.radians(180), math.radians(18), 0), verts=32, bevel=0.03, r2=0.0)
    for k in range(3):
        sphere(0.12, (0.08 + k * 0.42, -0.48, 0.85), VR['ink'])
    render('chat')


def vr_inventory():
    # Le bac du disquaire : une caisse, des pochettes de toutes les couleurs, une qui dépasse.
    scene(VR['bg'], 'w', (3.0, -7.6, 3.4), (0, 0, 1.15), lens=42)
    W, D, H, t = 3.6, 1.6, 1.0, 0.12
    wood = '#b98a5a'
    rbox(W, D, t, (0, 0, t / 2), wood, bevel=0.03)
    for x in (-W / 2 + t / 2, W / 2 - t / 2):
        rbox(t, D, H, (x, 0, H / 2), wood, bevel=0.03)
    rbox(W, t, H * 0.75, (0, -D / 2 + t / 2, H * 0.375), wood, bevel=0.03)
    rbox(W, t, H, (0, D / 2 - t / 2, H / 2), wood, bevel=0.03)
    colors = [VR['neon'], VR['cream'], VR['ink'], VR['red'], VR['grey'], VR['cream'], VR['neon'], '#3c6e8f', VR['ink'], VR['cream']]
    for i, c in enumerate(colors):
        x = -1.45 + i * 0.32
        lift = 0.55 if i == 4 else 0
        rbox(0.05, 1.25, 1.25, (x, 0.05, 0.75 + lift), c, rot=(0, math.radians(-14 + (i % 3) * 3), 0), bevel=0.015)
    # le disque qui sort de sa pochette
    cyl(0.6, 0.03, (-0.15, 0.02, 1.95), VR['ink'], rot=(0, math.radians(76), 0), bevel=0.01)
    cyl(0.2, 0.034, (-0.15, 0.02, 1.95), VR['neon'], rot=(0, math.radians(76), 0), bevel=0.004)
    render('inventory')


def vr_player():
    # La platine : socle, plateau, le disque à étiquette néon, le bras crème.
    scene(VR['bg'], 'w', (0.6, -6.4, 4.6), (0.2, 0.1, 0.4), lens=45)
    rbox(4.0, 3.0, 0.45, (0, 0, 0.225), '#2f2e2b', bevel=0.12)
    cyl(1.25, 0.12, (-0.45, 0, 0.5), '#8a8880', bevel=0.03)
    cyl(1.2, 0.05, (-0.45, 0, 0.6), VR['ink'], bevel=0.01, rough=0.3) if False else cyl(1.2, 0.05, (-0.45, 0, 0.6), VR['ink'], bevel=0.01)
    for rr in (0.6, 0.8, 1.0):
        torus(rr, 0.006, (-0.45, 0, 0.63), '#2a2a28')
    cyl(0.38, 0.055, (-0.45, 0, 0.62), VR['neon'], bevel=0.005)
    cyl(0.03, 0.12, (-0.45, 0, 0.68), VR['cream'], bevel=0.005)
    cyl(0.16, 0.25, (1.45, 0.95, 0.55), VR['cream'], bevel=0.03)
    arm = cyl(0.045, 2.0, (1.0, 0.25, 0.78), VR['cream'], rot=(math.radians(90), 0, math.radians(-35)), bevel=0.01)
    rbox(0.22, 0.32, 0.08, (0.42, -0.6, 0.74), VR['cream'], rot=(0, 0, math.radians(-35)), bevel=0.03)
    for k in range(2):
        cyl(0.13, 0.06, (1.45 - k * 0.42, -1.15, 0.48), VR['neon'] if k == 0 else '#5d5c57', bevel=0.02)
    render('player')


def vr_demande():
    # La demande spéciale : la loupe néon sur un disque, on cherche LE vinyle.
    scene(VR['bg'], 's', (0, -6.0, 5.0), (0, 0, 0.4), lens=50)
    cyl(1.45, 0.04, (-0.2, 0.1, 0.05), VR['ink'], bevel=0.01)
    for rr in (0.8, 1.05, 1.3):
        torus(rr, 0.006, (-0.2, 0.1, 0.08), '#2a2a28')
    cyl(0.48, 0.045, (-0.2, 0.1, 0.07), VR['cream'], bevel=0.005)
    torus(0.62, 0.09, (0.35, -0.25, 0.85), VR['neon'], rot=(math.radians(62), 0, math.radians(18)))
    lens = cyl(0.6, 0.03, (0.35, -0.25, 0.85), '#e9f6ff', rot=(math.radians(62), 0, math.radians(18)), bevel=0.01)
    lens.data.materials[0] = clay('#e9f6ff', rough=0.05, coat=0.6)
    cyl(0.1, 1.2, (1.15, -0.85, 0.35), VR['neon'], rot=(math.radians(62), math.radians(-38), math.radians(18)), bevel=0.04)
    render('demande')


# --------------------------------------------------------------------------------------------------------------------
# Formes à plat extrudées (tuiles aux coins vraiment ronds, étoile, coq, texte) : le biseau de rbox reste limité par l'épaisseur.
def rrect_pts(w, h, r, n=12):
    r = min(r, min(w, h) * 0.499)
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def star_pts(rout, rin, k=5):
    return [((rout if i % 2 == 0 else rin) * math.cos(math.radians(90 + i * 180 / k)),
             (rout if i % 2 == 0 else rin) * math.sin(math.radians(90 + i * 180 / k))) for i in range(2 * k)]


def extrude(pts, depth, loc, color, rot=(0, 0, 0), bevel=0.03):
    """Un contour (sens trigo) extrudé le long de Z, centré sur loc ; les faces planes restent plates, le biseau arrondi."""
    me = bpy.data.meshes.new('ext'); bm = bmesh.new()
    bot = [bm.verts.new((x, y, -depth / 2)) for x, y in pts]
    top = [bm.verts.new((x, y, depth / 2)) for x, y in pts]
    bm.faces.new(top); bm.faces.new(bot[::-1])
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('ext', me)); o.location = loc; o.rotation_euler = rot
    finish(o, color, bevel=min(bevel, depth * 0.45))
    for poly in o.data.polygons:
        if abs(poly.normal.z) > 0.99:
            poly.use_smooth = False
    return o


def rrect(w, h, r, depth, loc, color, rot=(0, 0, 0), bevel=0.03):
    return extrude(rrect_pts(w, h, r), depth, loc, color, rot, bevel)


def from_curve(cu, loc, color, rot):
    tmp = link(bpy.data.objects.new('tmp', cu))
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(tmp, do_unlink=True)
    o = link(bpy.data.objects.new('flat', me)); o.location = loc; o.rotation_euler = rot
    return finish(o, color)


FONT = r'C:\Windows\Fonts\arialbd.ttf'
def text3d(s, size, depth, loc, color, rot=(0, 0, 0), bevel=0.012):
    cu = bpy.data.curves.new('t', 'FONT')
    cu.body = s; cu.size = size; cu.extrude = depth; cu.bevel_depth = bevel; cu.bevel_resolution = 3
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    if os.path.exists(FONT):
        cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    return from_curve(cu, loc, color, rot)


def svg_mark(path, height, depth, loc, color, rot=(0, 0, 0), bevel=0.015, steps=8):
    """Un SVG à tracés absolus (M C L H V Z) extrudé ; les sous-tracés imbriqués font les trous."""
    src = open(os.path.join(ROOT, path), encoding='utf8').read()
    vw, vh = [float(v) for v in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src).groups()]
    tokens = re.findall(r'[MCLHVZ]|-?\d*\.?\d+(?:e-?\d+)?', re.search(r'\sd="([^"]+)"', src).group(1))
    k = height / vh
    subs, cur, x, y, i, cmd = [], [], 0.0, 0.0, 0, 'M'
    num = lambda n: float(tokens[n])
    while i < len(tokens):
        if tokens[i] in 'MCLHVZ':
            cmd = tokens[i]; i += 1
            if cmd == 'Z':
                subs.append(cur); cur = []
                continue
        if cmd == 'M':
            x, y = num(i), num(i + 1); i += 2; cur = [(x, y)]; cmd = 'L'
        elif cmd == 'L':
            x, y = num(i), num(i + 1); i += 2; cur.append((x, y))
        elif cmd == 'H':
            x = num(i); i += 1; cur.append((x, y))
        elif cmd == 'V':
            y = num(i); i += 1; cur.append((x, y))
        elif cmd == 'C':
            p = [num(i + j) for j in range(6)]; i += 6
            x0, y0 = x, y
            for s in range(1, steps + 1):
                t = s / steps; u = 1 - t
                cur.append((u ** 3 * x0 + 3 * u * u * t * p[0] + 3 * u * t * t * p[2] + t ** 3 * p[4],
                            u ** 3 * y0 + 3 * u * u * t * p[1] + 3 * u * t * t * p[3] + t ** 3 * p[5]))
            x, y = p[4], p[5]
    cu = bpy.data.curves.new('mark', 'CURVE')
    cu.dimensions = '2D'; cu.fill_mode = 'BOTH'; cu.extrude = depth; cu.bevel_depth = bevel; cu.bevel_resolution = 3
    for sub in subs:
        if len(sub) > 1 and abs(sub[0][0] - sub[-1][0]) + abs(sub[0][1] - sub[-1][1]) < 1e-3:
            sub = sub[:-1]
        sp = cu.splines.new('POLY'); sp.points.add(len(sub) - 1); sp.use_cyclic_u = True
        for pt, (px, py) in zip(sp.points, sub):
            pt.co = ((px - vw / 2) * k, (vh / 2 - py) * k, 0, 1)
    return from_curve(cu, loc, color, rot)


def stand(angle, margin=0.02):
    """Redresse la composition posée à plat, face à la caméra, puis la repose sur le sol."""
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'ground']
    bpy.context.view_layer.update()
    R = Matrix.Rotation(math.radians(angle), 4, 'X')
    for o in objs:
        o.matrix_world = R @ o.matrix_world
    bpy.context.view_layer.update()
    low = min((o.matrix_world @ Vector(c)).z for o in objs for c in o.bound_box)
    for o in objs:
        o.location.z += margin - low


# MyFrenchTool : tuiles blanches, bleu France, encre ; le rouge seulement pour le clin d'œil tricolore.
MF = {'bg': '#ffffff', 'blue': '#0052CC', 'sky': '#1a6fe0', 'ink': '#050505', 'white': '#fbfbfd', 'mist': '#dfe5ef',
      'line': '#b9c4d6', 'red': '#E1000F', 'gold': '#f5a623', 'teal': '#00b388', 'violet': '#7a3fe0', 'wood': '#e8c9a0'}
COQ = 'assets/myfrenchtool/logo-mark.svg'


def mf_scene(size, cam, target, lens):
    # Sur tuile blanche : moins de lumière (le bleu France délavait, les gris clairs disparaissaient), pas de contre-jour
    # (son ombre vers la caméra faisait une bande grise sous l'objet).
    scene(MF['bg'], size, cam, target, lens=lens, key_power=420, ambient=0.35, back=0)


def mf_check(loc, color, s=1.0):
    ax, ay, bx, by, cx, cy, t = -0.12 * s, 0.01 * s, -0.03 * s, -0.08 * s, 0.13 * s, 0.08 * s, 0.06 * s
    h, r = t / 2 / math.sqrt(2), t / math.sqrt(2)
    pts = [(ax - h, ay - h), (bx, by - r), (cx + h, cy - h), (cx - h, cy + h), (bx, by + r), (ax + h, ay + h)]
    return extrude(pts, 0.05, loc, color, bevel=0.012)


def mf_tool():
    # La fiche outil, c'est un bento : le coq, la note, le prix, posés sur leur plateau.
    mf_scene('l', (0, -8.0, 3.4), (0, 0, 1.35), 50)
    rrect(4.3, 3.1, 0.34, 0.14, (0, 0, 0.07), MF['mist'], bevel=0.05)
    rrect(1.95, 2.7, 0.3, 0.32, (-0.97, 0, 0.3), MF['blue'], bevel=0.07)
    svg_mark(COQ, 1.75, 0.05, (-0.97, 0, 0.53), MF['white'])
    rrect(1.95, 1.27, 0.26, 0.24, (1.03, 0.715, 0.26), MF['white'], bevel=0.06)
    extrude(star_pts(0.46, 0.2), 0.14, (1.03, 0.7, 0.45), MF['gold'], bevel=0.05)
    rrect(1.95, 1.27, 0.26, 0.46, (1.03, -0.715, 0.37), MF['ink'], bevel=0.08)
    # Le € dessiné (celui d'Arial a des contours qui se chevauchent : l'extrusion les montrait).
    z = 0.66
    torus(0.31, 0.07, (1.08, -0.715, z), MF['white'], arc=270, start=45)
    for dy in (0.09, -0.09):
        rrect(0.62, 0.11, 0.05, 0.1, (0.86, -0.715 + dy, z), MF['white'], bevel=0.03)
    stand(54)
    render('tool')


def mf_quiz():
    # Un point d'interrogation, trois réponses : la bonne est cochée.
    mf_scene('w', (0, -8.4, 2.6), (0, 0, 1.3), 42)
    # Le « ? » en boudin de pâte : un arc, une tige, un point.
    qx, qy, qz, R, tube = -2.3, 0.72, 0.3, 0.72, 0.22
    torus(R, tube, (qx, qy, qz), MF['blue'], arc=270, start=-90)
    sphere(tube, (qx - R, qy, qz), MF['blue'])
    sphere(tube, (qx, qy - R, qz), MF['blue'])    # le coude entre l'arc et la tige
    cyl(tube, 0.5, (qx, qy - R - 0.25, qz), MF['blue'], rot=(math.radians(90), 0, 0), verts=48, bevel=0)
    sphere(tube, (qx, qy - R - 0.5, qz), MF['blue'])
    sphere(0.27, (qx, qy - R - 1.15, qz), MF['blue'])
    for i, y in enumerate((1.05, 0, -1.05)):
        on = i == 1
        rrect(3.7, 0.84, 0.42, 0.3, (1.0, y, 0.15 + (0.14 if on else 0)), MF['blue'] if on else MF['mist'], bevel=0.08)
        z = 0.32 + (0.14 if on else 0)
        cyl(0.24, 0.1, (-0.5, y, z), MF['white'], verts=48, bevel=0.03)
        w = 2.1 if i == 2 else 2.7
        rrect(w, 0.16, 0.08, 0.05, (-0.1 + w / 2, y, z), MF['white'] if on else MF['line'], bevel=0.015)
        if on:
            mf_check((-0.5, y, z + 0.07), MF['blue'], s=1.1)
    stand(58)
    render('quiz')


def mf_barometre():
    # Le baromètre : un cadran sur son pied, l'échelle tricolore, l'aiguille.
    mf_scene('t', (0, -8.8, 2.7), (0, 0, 1.75), 50)
    X = (math.radians(90), 0, 0)
    rrect(2.1, 1.3, 0.3, 0.22, (0, 0, 0.11), MF['ink'], bevel=0.06)
    cyl(0.17, 0.55, (0, 0, 0.45), MF['ink'], bevel=0.01)
    Z, F = 2.1, -0.24
    cyl(1.5, 0.4, (0, 0, Z), MF['blue'], rot=X, verts=96, bevel=0.1)
    cyl(1.22, 0.06, (0, F, Z), MF['white'], rot=X, verts=96, bevel=0.02)
    for start, color in ((-25, MF['red']), (50.5, MF['line']), (126, MF['blue'])):
        torus(0.92, 0.1, (0, F - 0.06, Z), color, rot=X, arc=72, start=start)
    a = math.radians(62)
    rbox(0.11, 0.06, 0.72, (0.36 * math.cos(a), F - 0.14, Z + 0.36 * math.sin(a)), MF['ink'], rot=(0, math.radians(90) - a, 0), bevel=0.025)
    cyl(0.17, 0.12, (0, F - 0.14, Z), MF['ink'], rot=X, verts=32, bevel=0.03)
    render('barometre')


def mf_cover():
    # Le duel : deux icônes aux couleurs de leurs outils, le VS entre les deux, comme sur les covers.
    mf_scene('s', (0, -8.6, 2.1), (0, 0, 1.05), 50)
    X, T, H = math.radians(90), math.radians(13), 1.08
    for side, color in ((-1, MF['teal']), (1, MF['violet'])):
        th = -side * T
        nx, ny = math.sin(th), -math.cos(th)
        cx = side * 1.75
        rrect(2.0, 2.0, 0.52, 0.42, (cx, 0, H), color, rot=(X, 0, th), bevel=0.1)
        glyph = (cx + nx * 0.25, ny * 0.25, H)
        if side < 0:
            torus(0.42, 0.13, glyph, MF['white'], rot=(X, 0, th))
        else:
            extrude(star_pts(0.62, 0.17, 4), 0.1, glyph, MF['white'], rot=(X, 0, th), bevel=0.035)
    cyl(0.62, 0.26, (0, -0.55, H), MF['blue'], rot=(X, 0, 0), verts=64, bevel=0.07)
    text3d('VS', 0.5, 0.03, (0, -0.72, H), MF['white'], rot=(X, 0, 0))
    render('cover')


def mf_blog():
    # L'article : la page sur sa couverture bleue, le crayon posé dessus.
    mf_scene('s', (0, -7.8, 2.6), (0, 0, 1.15), 50)
    rrect(2.92, 3.52, 0.22, 0.14, (0, 0, 0.07), MF['blue'], bevel=0.05)
    rrect(2.6, 3.2, 0.16, 0.14, (0, 0, 0.2), MF['white'], bevel=0.04)
    z = 0.29
    rrect(1.5, 0.22, 0.11, 0.05, (-0.35, 1.2, z), MF['ink'], bevel=0.015)
    rrect(2.1, 1.0, 0.12, 0.05, (0, 0.45, z), MF['sky'], bevel=0.015)
    for i, w in enumerate((2.1, 2.1, 1.7, 1.1)):
        rrect(w, 0.13, 0.065, 0.05, (-1.05 + w / 2, -0.35 - i * 0.3, z), MF['line'], bevel=0.015)
    # Le crayon, pointe en bas à gauche.
    al = math.radians(-128)
    d = Vector((math.cos(al), math.sin(al), 0))
    rot = (math.radians(90), 0, al + math.radians(90))
    o, zp = Vector((0.5, -0.3, 0)), 0.72
    at = lambda t: (o.x + d.x * t, o.y + d.y * t, zp)
    cyl(0.17, 2.1, at(0), MF['blue'], rot=rot, verts=6, bevel=0.03)
    cyl(0.17, 0.45, at(1.27), MF['wood'], rot=rot, verts=32, bevel=0.005, r2=0.05)
    cyl(0.05, 0.14, at(1.55), MF['ink'], rot=rot, verts=24, bevel=0.005, r2=0.0)
    cyl(0.175, 0.2, at(-1.15), MF['line'], rot=rot, verts=32, bevel=0.01)
    cyl(0.17, 0.26, at(-1.37), MF['red'], rot=rot, verts=32, bevel=0.06)
    stand(55)
    render('blog')


# --------------------------------------------------------------------------------------------------------------------
# Candidature Lacoste (projets imaginés) : des objets originaux, univers club de tennis. Vert, rouge et noir relevés dans le
# logo 2026 ; le reste (papier, balle, terre battue, bois) sont des couleurs d'objets.
#   blender -b --factory-startup -P scripts/blender/make-features.py -- apply/lacoste [nom…]
LC = {'green': '#06532A', 'deep': '#0B3A20', 'ink': '#181713', 'red': '#D30018', 'paper': '#F3EFE4', 'white': '#FBF8F1',
      'ball': '#D7DF3F', 'clay': '#C4673E', 'wood': '#C39A69', 'gold': '#D9B15C', 'pale': '#DCE6D8', 'grey': '#8E938C'}


def lc_scene(bg, cam, target, lens=50, power=480):
    scene(bg, 't', cam, target, lens=lens, key_power=power, ambient=0.5, back=0.15)
    if os.environ.get('PREVIEW_SAMPLES'):
        bpy.context.scene.cycles.samples = int(os.environ['PREVIEW_SAMPLES'])


def lean(angle, axis='Y', margin=0.02):
    """Incline tout ce qui est posé (axe du monde), puis le repose sur le sol."""
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'ground']
    bpy.context.view_layer.update()
    R = Matrix.Rotation(math.radians(angle), 4, axis)
    for o in objs:
        o.matrix_world = R @ o.matrix_world
    bpy.context.view_layer.update()
    low = min((o.matrix_world @ Vector(c)).z for o in objs for c in o.bound_box)
    for o in objs:
        o.location.z += margin - low


def lathe(profile, loc, color, verts=64):
    """Un profil (rayon, hauteur) tourné autour de Z : coupe, vase, pied."""
    me = bpy.data.meshes.new('lathe'); bm = bmesh.new()
    rings = [[bm.verts.new((r * math.cos(2 * math.pi * i / verts), r * math.sin(2 * math.pi * i / verts), z)) for i in range(verts)] for r, z in profile]
    for A, B in zip(rings, rings[1:]):
        for i in range(verts):
            j = (i + 1) % verts
            bm.faces.new((A[i], A[j], B[j], B[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('lathe', me)); o.location = loc
    return finish(o, color)


def lc_render(name):
    # Moins de segments de biseau : les modèles restent sous la cible de poids, l'œil ne voit pas la différence.
    for o in bpy.context.scene.objects:
        for m in o.modifiers:
            if m.type == 'BEVEL':
                m.segments = min(m.segments, 2)
    render(name)


def lc_ball(loc, r=0.46):
    sphere(r, loc, LC['ball'])
    for rot in ((math.radians(62), math.radians(18), 0), (math.radians(-58), math.radians(-22), math.radians(90))):
        torus(r * 0.99, r * 0.04, loc, LC['white'], rot=rot, arc=170, start=5)


def lc_raquette():
    # Jour de match : la raquette debout, cordée, et sa balle.
    lc_scene(LC['green'], (0, -12.2, 3.3), (0.15, 0, 2.9), 50, 620)
    X, cz, R, sx, sz = math.radians(90), 3.75, 1.18, 0.82, 1.12
    a, b = R * sx, R * sz
    head = torus(R, 0.11, (0, 0, cz), LC['white'], rot=(X, 0, 0)); head.scale = (sx, sz, 1)
    for i in range(9):
        x = -0.8 * a + i * 1.6 * a / 8
        rbox(0.026, 0.026, 2 * b * math.sqrt(1 - (x / a) ** 2), (x, 0, cz), LC['pale'], bevel=0)
    for i in range(11):
        z = -0.82 * b + i * 1.64 * b / 10
        rbox(2 * a * math.sqrt(1 - (z / b) ** 2), 0.026, 0.026, (0, 0, cz + z), LC['pale'], bevel=0)
    dx, dz = 0.42, 0.95
    ang, L = math.atan2(dx, dz), math.hypot(dx, dz) + 0.08
    for s in (-1, 1):
        rbox(0.12, 0.12, L, (s * 0.33, 0, 2.2), LC['white'], rot=(0, s * ang, 0), bevel=0.05)
    rbox(0.78, 0.12, 0.11, (0, 0, 2.66), LC['white'], bevel=0.05)
    rbox(0.26, 0.2, 0.42, (0, 0, 1.56), LC['red'], bevel=0.05)
    rbox(0.3, 0.25, 1.32, (0, 0, 0.72), LC['ink'], bevel=0.08)
    rbox(0.36, 0.3, 0.13, (0, 0, 0.07), LC['white'], bevel=0.05)
    lean(-13)
    lc_ball((1.5, -0.35, 0.48))
    lc_render('raquette')


def lc_one_polo(z, body, trim, badge=False):
    rrect(3.0, 3.5, 0.28, 0.42, (0, 0, z), body, bevel=0.12)
    if not badge:
        return
    for s in (-1, 1):
        rrect(0.92, 3.3, 0.22, 0.09, (s * 1.0, -0.02, z + 0.24), body, bevel=0.04)
    rrect(3.0, 0.9, 0.22, 0.1, (0, -1.28, z + 0.28), body, bevel=0.04)
    t = z + 0.31
    cyl(0.52, 0.06, (0, 1.32, t), LC['ink'], verts=48, bevel=0.01)
    rbox(0.42, 1.16, 0.05, (0, 0.62, t), trim, bevel=0.02)
    for k in range(3):
        cyl(0.055, 0.06, (0, 0.98 - k * 0.32, t + 0.04), LC['white'], verts=20, bevel=0.012)
    for s in (-1, 1):
        extrude([(s * 0.02, 0.92), (s * 0.82, 1.08), (s * 0.82, 1.56), (s * 0.28, 1.72), (s * 0.05, 1.5)][::s], 0.12, (0, 0, t + 0.08), trim, bevel=0.05)
    # À la place d'un écusson : mes initiales, brodées.
    rrect(0.62, 0.5, 0.12, 0.05, (0.86, 0.5, t), LC['white'], bevel=0.015)
    text3d('JT', 0.26, 0.03, (0.86, 0.46, t + 0.03), LC['red'], rot=(0, 0, 0))


def lc_polo():
    # Mon polo : une pile pliée, comme sur la table d'une boutique.
    lc_scene(LC['paper'], (0, -9.6, 3.0), (0, 0, 1.7), 50, 380)
    lc_one_polo(0.22, LC['white'], LC['pale'])
    lc_one_polo(0.72, LC['red'], LC['white'])
    lc_one_polo(1.22, LC['green'], LC['white'], badge=True)
    stand(50)
    lc_render('polo')


def lc_cintre():
    # La bonne taille : le cintre, le mètre ruban, l'étiquette.
    lc_scene(LC['red'], (0, -12.4, 2.9), (0, 0, 2.95), 50, 560)
    X = math.radians(90)
    sh, zc = math.radians(17), 5.0
    for s in (-1, 1):
        rbox(2.05, 0.2, 0.26, (s * 0.98, 0, zc - 0.3), LC['wood'], rot=(0, s * sh, 0), bevel=0.1)
    cyl(0.045, 0.5, (0, 0, zc + 0.14), LC['grey'], verts=20, bevel=0.01)
    torus(0.27, 0.045, (0, 0, zc + 0.62), LC['grey'], rot=(X, 0, 0), arc=255, start=-75)
    cyl(0.05, 3.3, (0, 0, zc - 1.12), LC['grey'], rot=(0, X, 0), verts=20, bevel=0.01)
    for s, x, L, c in ((-1, -0.55, 3.9, LC['ball']), (1, -0.1, 2.5, LC['ball'])):
        z = zc - 1.12 - L / 2
        rbox(0.42, 0.035, L, (x, -0.07, z), c, bevel=0.012)
        for k in range(int(L / 0.25)):
            major = k % 4 == 0
            rbox(0.2 if major else 0.11, 0.03, 0.022, (x - 0.21 + (0.1 if major else 0.055), -0.1, zc - 1.3 - k * 0.25), LC['ink'], bevel=0)
    cyl(0.5, 0.42, (-0.55, -0.07, 0.5), LC['ink'], rot=(X, 0, 0), verts=48, bevel=0.06)
    cyl(0.16, 0.44, (-0.55, -0.07, 0.5), LC['white'], rot=(X, 0, 0), verts=32, bevel=0.03)
    rrect(0.95, 1.22, 0.14, 0.05, (1.15, -0.05, 2.25), LC['white'], rot=(X, 0, 0), bevel=0.02)
    text3d('M', 0.55, 0.04, (1.15, -0.1, 2.1), LC['red'], rot=(X, 0, 0))
    torus(0.12, 0.018, (1.15, -0.05, 3.0), LC['ink'], rot=(X, 0, 0))
    rbox(0.022, 0.022, 0.86, (1.05, -0.05, 3.5), LC['ink'], rot=(0, math.radians(-33), 0), bevel=0)
    lc_render('cintre')


def lc_casier():
    # Le vestiaire : le casier ouvert, un polo sur son cintre, le numéro sur la porte.
    lc_scene(LC['pale'], (2.7, -11.8, 3.5), (0.35, 0, 2.55), 50, 400)
    W, D, H, t = 2.3, 1.6, 4.9, 0.12
    g, dk = LC['green'], LC['deep']
    rbox(W, D, t, (0, 0, t / 2 + 0.25), g, bevel=0.03)
    rbox(W, D, t, (0, 0, H - t / 2), g, bevel=0.03)
    rbox(W, t, H - 0.25, (0, D / 2 - t / 2, (H + 0.25) / 2), dk, bevel=0.03)
    for s in (-1, 1):
        rbox(t, D, H - 0.25, (s * (W / 2 - t / 2), 0, (H + 0.25) / 2), g, bevel=0.03)
        rbox(0.22, 0.22, 0.3, (s * (W / 2 - 0.22), -D / 2 + 0.22, 0.15), LC['ink'], bevel=0.05)
    cyl(0.04, W - 0.25, (0, 0.15, H - 0.45), LC['grey'], rot=(0, math.radians(90), 0), verts=20, bevel=0.01)
    torus(0.13, 0.025, (0, 0.15, H - 0.57), LC['grey'], rot=(math.radians(90), 0, 0), arc=210, start=-20)
    for s in (-1, 1):
        rbox(0.82, 0.12, 0.13, (s * 0.4, 0.15, H - 0.9), LC['wood'], rot=(0, s * math.radians(14), 0), bevel=0.05)
    rrect(1.36, 2.3, 0.14, 0.2, (0, 0.12, 2.75), LC['white'], rot=(math.radians(90), 0, 0), bevel=0.07)
    rbox(0.42, 0.06, 0.6, (0, -0.02, 3.45), LC['pale'], bevel=0.02)
    for s in (-1, 1):
        rbox(0.52, 0.14, 0.34, (s * 0.42, 0.0, 3.8), LC['pale'], rot=(0, s * math.radians(20), 0), bevel=0.05)
    # La porte, ouverte autour de sa charnière gauche.
    a = math.radians(50)
    hx, hy, dw = -W / 2, -D / 2, W - 0.05
    cx, cy = hx + math.cos(a) * dw / 2, hy - math.sin(a) * dw / 2
    rz = -a
    def on_door(u, n, z):
        return (hx + math.cos(a) * (dw / 2 + u) - math.sin(a) * n * -1, hy - math.sin(a) * (dw / 2 + u) - math.cos(a) * n * -1, z)
    rbox(dw, 0.1, H - 0.4, (cx, cy, (H + 0.25) / 2), g, rot=(0, 0, rz), bevel=0.04)
    for k in range(4):
        rbox(1.2, 0.03, 0.08, on_door(0, -0.055, 4.25 - k * 0.2), LC['ink'], rot=(0, 0, rz), bevel=0)
    rrect(0.85, 0.62, 0.1, 0.05, on_door(0, -0.06, 3.05), LC['white'], rot=(math.radians(90), 0, rz), bevel=0.02)
    text3d('12', 0.4, 0.03, on_door(0, -0.1, 2.9), LC['red'], rot=(math.radians(90), 0, rz))
    rbox(0.1, 0.1, 0.6, on_door(dw / 2 - 0.2, -0.08, 2.4), LC['ink'], rot=(0, 0, rz), bevel=0.04)
    lc_render('casier')


def lc_club():
    # Le Club : la coupe, la balle dedans, la carte de membre posée contre le socle.
    lc_scene(LC['ink'], (0.3, -11.2, 3.0), (0, 0, 2.55), 50, 560)
    X = math.radians(90)
    cyl(1.32, 0.34, (0, 0, 0.17), LC['green'], verts=96, bevel=0.08)
    cyl(1.05, 0.28, (0, 0, 0.48), LC['white'], verts=96, bevel=0.06)
    lathe([(0.0, 0.62), (0.3, 0.62), (0.2, 0.86), (0.14, 1.25), (0.2, 1.62), (0.42, 1.86), (0.82, 2.14), (1.08, 2.6), (1.18, 3.15), (1.22, 3.7), (1.14, 3.72), (1.08, 3.2), (0.0, 3.2)], (0, 0, 0), LC['gold'])
    for s in (-1, 1):
        torus(0.62, 0.09, (s * 1.22, 0, 3.0), LC['gold'], rot=(X, 0, 0), arc=210, start=-105 if s > 0 else 75)
    sphere(0.82, (0, 0, 3.72), LC['ball'])
    torus(0.81, 0.032, (0, 0, 3.72), LC['white'], rot=(math.radians(68), math.radians(20), 0), arc=180, start=10)
    torus(0.81, 0.032, (0, 0, 3.72), LC['white'], rot=(math.radians(-60), math.radians(-25), math.radians(90)), arc=180, start=10)
    lc_render('coupe')


SCENES = {
    'apply/lacoste': {'raquette': lc_raquette, 'polo': lc_polo, 'cintre': lc_cintre, 'casier': lc_casier, 'coupe': lc_club},
    'vinyl-run': {'map': vr_map, 'chat': vr_chat, 'inventory': vr_inventory, 'player': vr_player, 'demande': vr_demande},
    'myfrenchtool': {'tool': mf_tool, 'quiz': mf_quiz, 'barometre': mf_barometre, 'cover': mf_cover, 'blog': mf_blog},
}
for name, fn in SCENES[PROJECT].items():
    if not ONLY or name in ONLY:
        fn()
