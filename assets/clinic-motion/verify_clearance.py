"""Offline triangle-level patient/furniture clearance on original full walls.
Retain original seated-contact intersections as the accepted baseline.
"""
import bpy,sys,json,math
from pathlib import Path
from collections import Counter
from mathutils import Matrix
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];SOURCE=Path(sys.argv[sys.argv.index('--')+1]);LOCAL=ROOT/'assets/clinic-motion/local'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'clinic-source.blend'))
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();points=[];faces=[];owners=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH' or any(s in o.name.lower() for s in ['floor','rug']):continue
 ev=o.evaluated_get(dg);mesh=ev.to_mesh();mesh.calc_loop_triangles();start=len(points)
 points.extend(o.matrix_world@v.co for v in mesh.vertices)
 for tri in mesh.loop_triangles:faces.append(tuple(start+i for i in tri.vertices));owners.append(o.name)
 ev.to_mesh_clear()
world=BVHTree.FromPolygons(points,faces,all_triangles=True)
bpy.ops.wm.open_mainfile(filepath=str(LOCAL/'patient-seated-motion.blend'))
anchor=Matrix.Translation((2.65,-4.35,0))@Matrix.Rotation(math.pi,4,'Z')
rows=[]
for p in [.47,.19,.22,.25,.27,.30,.325,.35,.375,.395,.40,.4075,.415,.425,.43,.60,.615,.63,.655,.68,.72,.78]:
 frame=1+p*600;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame));bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
 vertices=[];triangles=[]
 for o in bpy.context.scene.objects:
  if o.type!='MESH':continue
  ev=o.evaluated_get(dg);mesh=ev.to_mesh();mesh.calc_loop_triangles();start=len(vertices)
  vertices.extend(anchor@o.matrix_world@v.co for v in mesh.vertices)
  triangles.extend(tuple(start+i for i in tri.vertices) for tri in mesh.loop_triangles);ev.to_mesh_clear()
 person=BVHTree.FromPolygons(vertices,triangles,all_triangles=True)
 hits=Counter(owners[b] for a,b in person.overlap(world));rows.append({'p':p,'intersections':dict(hits)});print('CLEARANCE',rows[-1],flush=True)
baseline=set(rows[0]['intersections'])
new=[r for r in rows if set(r['intersections'])-baseline]
(LOCAL/'clearance.json').write_text(json.dumps({'acceptedSeatedBaseline':rows[0],'samples':rows,'newIntersections':new},indent=2))
assert not new, f'New furniture/wall intersections: {new}'
print('PASS FULL-HEIGHT WALL/FURNITURE TRIANGLE CLEARANCE; BASELINE SEATED CONTACTS RETAINED')
