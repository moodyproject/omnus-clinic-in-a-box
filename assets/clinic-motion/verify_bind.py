"""Compare ALL evaluated accepted vertices against derivative skin bind.
Blender --python-exit-code 1 --python ... -- <donor-source-dir>.
"""
import bpy,sys,json
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[2];SOURCE=Path(sys.argv[sys.argv.index('--')+1]);LOCAL=ROOT/'assets/clinic-motion/local'
report=[]
for asset,source in [('physician-seated','physician'),('patient-seated','patient'),('room-people','room-people')]:
 bpy.ops.wm.open_mainfile(filepath=str(SOURCE/(source+'-source.blend')))
 if source!='room-people':
  shift=json.loads((SOURCE/(source+'-contact.json')).read_text())['floor_shift']
  next(o for o in bpy.context.scene.objects if o.type=='ARMATURE').location.z-=shift
 bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();expected={}
 for o in bpy.context.scene.objects:
  if o.type!='MESH':continue
  ev=o.evaluated_get(dg);mesh=ev.to_mesh();expected[o.name]=[o.matrix_world@v.co for v in mesh.vertices];ev.to_mesh_clear()
 bpy.ops.wm.open_mainfile(filepath=str(LOCAL/(asset+'-motion.blend')))
 for rig in [o for o in bpy.context.scene.objects if o.type=='ARMATURE']:
  rig.animation_data_clear()
  if source!='room-people':rig.location=(0,0,-shift);rig.rotation_euler=(0,0,0)
  for b in rig.pose.bones:b.matrix_basis=Matrix.Identity(4)
 bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();errors=[]
 for o in bpy.context.scene.objects:
  if o.type!='MESH':continue
  ev=o.evaluated_get(dg);mesh=ev.to_mesh();points=[o.matrix_world@v.co for v in mesh.vertices];ev.to_mesh_clear()
  assert len(points)==len(expected[o.name]),o.name
  error=max((a-b).length for a,b in zip(points,expected[o.name]));assert error<.00001,(o.name,error)
  errors.append({'mesh':o.name,'vertices':len(points),'maxErrorMeters':error})
 report.append({'asset':asset,'meshes':errors})
(LOCAL/'bind-appearance-verification.json').write_text(json.dumps(report,indent=2));print('PASS EVERY ACCEPTED SOURCE VERTEX RETAINED AT SKIN BIND',json.dumps(report))
