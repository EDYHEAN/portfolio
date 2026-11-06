# Les illustrations 3D des « Features clés » (Johan, 06/11 : les captures n'apportaient rien) : de petites scènes en pâte
# à modeler douce, aux couleurs du projet, rendues au format de leur tuile du bento.
#   blender -b --factory-startup -P scripts/blender/make-features.py -- vinyl-run [nom…]
# Écrit assets/<projet>/features3d/<nom>.webp. Modélisation 100 % procédurale (pas d'asset externe).
import bpy, bmesh, math, os, sys
from mathutils import Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
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


def torus(R, r, loc, color, rot=(0, 0, 0), arc=360.0):
    me = bpy.data.meshes.new('tor'); bm = bmesh.new()
    n, m = 96, 24
    rings = []
    steps = n if arc >= 360 else n + 1
    for i in range(steps):
        a = math.radians(arc) * i / n
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


def scene(bg, size, cam_loc, target, lens=50, key=(-4, -5, 7), key_power=900):
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
    bgn.inputs['Color'].default_value = lin(bg); bgn.inputs['Strength'].default_value = 0.55
    ground = rbox(80, 80, 0.2, (0, 0, -0.1), bg, bevel=0)
    ground.data.materials[0] = clay(bg, rough=0.9, coat=0)
    ground.is_shadow_catcher = True
    for loc, power, size_l in ((key, key_power, 5), ((6, -3, 4), key_power * 0.28, 6), ((0, 6, 5), key_power * 0.35, 5)):
        ld = bpy.data.lights.new('l', 'AREA'); ld.energy = power; ld.size = size_l
        lo = link(bpy.data.objects.new('l', ld)); lo.location = loc
        lo.rotation_euler = (Vector(loc) - Vector(target)).to_track_quat('Z', 'Y').to_euler()
    cd = bpy.data.cameras.new('c'); cd.lens = lens
    co = link(bpy.data.objects.new('c', cd)); co.location = cam_loc
    co.rotation_euler = (Vector(cam_loc) - Vector(target)).to_track_quat('Z', 'Y').to_euler()
    sc.camera = co


def render(name):
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


SCENES = {'vinyl-run': {'map': vr_map, 'chat': vr_chat, 'inventory': vr_inventory, 'player': vr_player, 'demande': vr_demande}}
for name, fn in SCENES[PROJECT].items():
    if not ONLY or name in ONLY:
        fn()
