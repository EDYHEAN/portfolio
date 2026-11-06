# La mâchoire du footer : deux rangées de crocs de hyène (ivoire) sur une gencive d'encre, en arc pour la profondeur.
# Blender en ligne de commande, sans interface :
#   blender -b --factory-startup -P scripts/blender/make-jaws.py -- assets/3d/jaws.glb
# Repère Blender : X = largeur, Y = profondeur (la caméra regarde vers +Y), Z = hauteur. La ligne de gencive est z = 0 ;
# la gencive du haut monte en mur jusqu'à z = GUM_H (elle remplit la moitié d'écran), ses crocs pendent vers le bas.
# Exporte JawUp et JawDown (origines sur leur ligne de gencive) en glTF Draco : three.js les anime (scenes3d.js).
import bpy, bmesh, math, random, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'jaws.glb'
HALF = 9.5      # demi-largeur couverte (unités) : assez pour un écran large
ARC = 0.018     # recul des côtés (y = ARC * x²)
GUM_H = 9.0     # hauteur du mur de gencive
RING = 12       # sommets par anneau de dent

# Une demi-rangée, du centre vers le bord : (type, largeur, hauteur, épaisseur, courbure vers l'arrière).
# Tout est pointu (Johan, 06/11 : des crocs, pas des molaires rondes), longs, et les canines dépassent de loin.
UPPER = [('incisor', .34, .85, .38, .1)] * 3 + [
    ('canine', .6, 2.45, .64, .32),
    ('premolar', .46, 1.0, .46, .08), ('premolar', .52, 1.35, .52, .1), ('premolar', .58, 1.6, .56, .12),
    ('carnassial', .8, 1.45, .48, .08),
]
LOWER = [('incisor', .32, .78, .34, -.1)] * 2 + [  # 2 incisives : la canine du bas se loge devant celle du haut
    ('canine', .56, 2.15, .6, -.3),
    ('premolar', .48, 1.05, .48, -.08), ('premolar', .54, 1.38, .54, -.1), ('premolar', .6, 1.6, .58, -.12),
    ('carnassial', .78, 1.35, .46, -.08),
]
# Au-delà : des crocs qui alternent grand / petit jusqu'au bord.
FILL = [('premolar', .56, 1.3, .54, .1), ('premolar', .44, .9, .44, .08)]
rng = random.Random(7)  # irrégularités (taille, inclinaison) : graine fixe, la mâchoire ne change pas d'un export à l'autre


def profile(kind, t):
    """Rayon relatif de la section à la hauteur t (0 = collet, 1 = pointe)."""
    # Flancs creusés (exposant > 1) : la dent s'effile en croc. Un peu de ventre au collet pour l'ancrer.
    belly = 1 + 0.12 * math.sin(min(t, 0.4) / 0.4 * math.pi)
    if kind == 'canine':
        return max(0.015, (1 - t) ** 1.05 * belly)
    if kind == 'incisor':
        return max(0.02, (1 - t) ** 1.2 * belly)
    if kind == 'carnassial':
        return max(0.02, (1 - t) ** 1.25 * belly)
    return max(0.02, (1 - t) ** 1.15 * belly)


def tooth(bm, cx, kind, w, h, d, bend, down, lean=0.0):
    """Une dent posée en x = cx sur l'arc ; down = pend vers le bas (mâchoire du haut)."""
    s = -1 if down else 1
    ang = math.atan(2 * ARC * cx)                          # suit la tangente de l'arc
    ca, sa = math.cos(ang), math.sin(ang)
    base = Vector((cx, ARC * cx * cx, 0))
    rings = []
    ts = [-0.35, -0.1, 0.0, 0.1, 0.24, 0.4, 0.56, 0.7, 0.82, 0.91, 0.97]  # la racine plonge dans la gencive
    for t in ts:
        tt = max(t, 0)
        r = profile(kind, tt)
        sx = w / 2 * r * (1.25 if kind == 'carnassial' else 1)
        sy = d / 2 * r * (0.7 if kind == 'carnassial' else 1)
        off = bend * h * tt * tt                           # la pointe recule (ou avance)
        ring = []
        for k in range(RING):
            a = 2 * math.pi * k / RING
            lx, ly = math.cos(a) * sx + lean * h * tt * tt, math.sin(a) * sy + off
            p = base + Vector((lx * ca - ly * sa, lx * sa + ly * ca, s * t * h))
            ring.append(bm.verts.new(p))
        rings.append(ring)
    tip_off = bend * h
    tip = bm.verts.new(base + Vector((lean * h * ca - tip_off * sa, lean * h * sa + tip_off * ca, s * h)))
    for a, b in zip(rings, rings[1:]):
        for k in range(RING):
            q = [a[k], a[(k + 1) % RING], b[(k + 1) % RING], b[k]]
            bm.faces.new(q if down else q[::-1])
    last = rings[-1]
    for k in range(RING):
        f = [last[k], last[(k + 1) % RING], tip]
        bm.faces.new(f if down else f[::-1])
    bm.faces.new(rings[0][::-1] if down else rings[0])     # fond de racine (caché dans la gencive)


def row(half, start):
    """Toute la rangée : la demi-rangée, complétée de crocs jusqu'au bord, puis son miroir. Chaque dent varie un peu
    (hauteur ±10 %, penchée) pour que la mâchoire ait l'air vivante, pas tamponnée."""
    sign = 1 if half[0][4] >= 0 else -1                    # le haut recule ses pointes, le bas les avance
    out, x, k = [], start, 0
    seq = list(half)
    while x < HALF + 0.6:
        if seq:
            kind, w, h, d, bend = seq.pop(0)
        else:
            kind, w, h, d, bend = FILL[k % 2]; bend *= sign; k += 1
        out.append((x + w / 2, (kind, w, h * rng.uniform(0.9, 1.1), d, bend, rng.uniform(-0.05, 0.05))))
        x += w + 0.06
    mirror = [(-cx, (kind, w, h * rng.uniform(0.94, 1.06), d, bend, -lean)) for cx, (kind, w, h, d, bend, lean) in out]
    return mirror + out


def gum(bm, down, teeth):
    """Le mur de gencive : profil arrondi au bord (la lèvre), festonné au-dessus de chaque dent."""
    s = 1 if down else -1                                  # le mur monte (mâchoire du haut) ou descend
    xs = [(-HALF - 0.8) + i * (2 * HALF + 1.6) / 220 for i in range(221)]
    # profil (avance y, hauteur z) : du dos du mur jusqu'à la lèvre, puis l'avant du mur
    prof = [(0.9, GUM_H), (0.9, 0.5), (0.75, 0.12), (0.45, -0.02), (0.0, -0.06), (-0.45, -0.02), (-0.62, 0.15), (-0.66, 0.6), (-0.66, GUM_H)]

    def scallop(x):                                        # la gencive descend un peu sur chaque collet
        best = 0
        for cx, spec in teeth:
            half = spec[1] / 2
            u = (x - cx) / half
            if abs(u) < 1:
                best = max(best, (1 - u * u) * 0.09)
        return best
    grid = []
    for x in xs:
        y0 = ARC * x * x
        drop = scallop(x)
        col = []
        for py, pz in prof:
            z = pz - (drop if pz < 0.3 else 0)
            col.append(bm.verts.new((x, y0 + py, s * z)))
        grid.append(col)
    for a, b in zip(grid, grid[1:]):
        for k in range(len(prof) - 1):
            q = [a[k], b[k], b[k + 1], a[k + 1]]
            bm.faces.new(q if down else q[::-1])


def mat(name, rgb, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = rough
    return m


def jaw(name, half, start, down, scale=1.0):
    teeth = row(half, start)
    tm = bpy.data.meshes.new(name + 'Teeth')
    bm = bmesh.new()
    for cx, (kind, w, h, d, bend, lean) in teeth:
        tooth(bm, cx, kind, w * scale, h * scale, d * scale, bend, down, lean)
    bm.to_mesh(tm); bm.free()
    gm = bpy.data.meshes.new(name + 'Gum')
    bm = bmesh.new(); gum(bm, down, teeth); bm.to_mesh(gm); bm.free()
    to = bpy.data.objects.new(name + 'Teeth', tm); go = bpy.data.objects.new(name, gm)
    for o in (to, go):
        bpy.context.collection.objects.link(o)
    to.data.materials.append(IVORY); go.data.materials.append(INK)
    # Lissage : une subdivision, puis on applique (le glTF exporte la géométrie finale).
    for o, lv in ((to, 1), (go, 1)):
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        sub = o.modifiers.new('sub', 'SUBSURF'); sub.levels = lv; sub.render_levels = lv
        bpy.ops.object.modifier_apply(modifier='sub')
        bpy.ops.object.shade_smooth()
        o.select_set(False)
    # Une seule pièce par mâchoire (deux matériaux) : JawUp / JawDown.
    to.select_set(True); go.select_set(True)
    bpy.context.view_layer.objects.active = go
    bpy.ops.object.join()
    go.select_set(False)
    return go


# Sans interface : scène vide d'usine. Dans Blender ouvert (MCP) : on vide la scène sans toucher aux add-ons.
if bpy.app.background:
    bpy.ops.wm.read_factory_settings(use_empty=True)
else:
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for d in list(coll):
            coll.remove(d)
IVORY = mat('Ivory', (0.84, 0.78, 0.64), 0.3)
INK = mat('Ink', (0.006, 0.005, 0.005), 0.42)
up = jaw('JawUp', UPPER, 0.0, True)                        # deux incisives encadrent le centre
dn = jaw('JawDown', LOWER, 0.0, False, 0.96)               # canines décalées : les crocs s'emboîtent
for o in (up, dn):
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB', use_selection=True, export_apply=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=12, export_draco_normal_quantization=8,
)
print('jaws ->', OUT, [(o.name, len(o.data.polygons)) for o in (up, dn)])
