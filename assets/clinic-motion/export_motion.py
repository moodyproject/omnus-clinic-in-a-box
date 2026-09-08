"""Rebind the existing accepted evaluated surfaces, not new anatomy.
Run Blender offline, --python-exit-code 1, -- <donor-source-dir>.
Large editable outputs stay in ignored assets/clinic-motion/local/.
"""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(Path(__file__).resolve().parent))
from patient_path import author_patient
SOURCE=Path(sys.argv[sys.argv.index('--')+1])
LOCAL=ROOT/'assets/clinic-motion/local';LOCAL.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public/models/3d-redesign'
report=[]
for asset,source in [('physician-seated','physician'),('patient-seated','patient'),('room-people','room-people')]:
 bpy.ops.wm.open_mainfile(filepath=str(SOURCE/(source+'-source.blend')))
 bpy.context.scene.render.fps=24;bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=601
 rigs=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
 # Capture the actual post-mask, post-corrective, post-subdivision accepted
 # surface together with interpolated deform groups. Binding it at the
 # existing seated pose makes the anchor exactly the static export surface.
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
 baked={o:bpy.data.meshes.new_from_object(o.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg) for o in meshes}
 rig_for={o:next(m.object for m in o.modifiers if m.type=='ARMATURE') for o in meshes}
 for o in meshes:
  o.modifiers.clear();o.data=baked[o]
  for poly in o.data.polygons:poly.use_smooth=True
 for rig in rigs:
  rig.animation_data_clear();bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
  bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT')
 for o in meshes:
  modifier=o.modifiers.new('Accepted surface skin','ARMATURE');modifier.object=rig_for[o]
 if source!='room-people':
  shift=json.loads((SOURCE/(source+'-contact.json')).read_text())['floor_shift']
  rigs[0].location.z-=shift
 bpy.context.view_layer.update()
 for i,rig in enumerate(rigs):
  rig['acceptedMotion']='Seated bind from evaluated accepted source; original weighted skeleton'
  for bone in rig.pose.bones:bone.rotation_mode='QUATERNION'
  # In-place listening and relaxed conversational forearm gestures. Lower
  # body and upper arms stay at their supported accepted anchor.
  for frame in range(1,602,3):
   p=(frame-1)/600;phase=p*math.tau*9+i*1.71+(0.6 if source=='patient' else 0)
   for name,axis,angle in [('head','Z',.14*math.sin(phase)),('neck01','X',.045*math.sin(phase*.83)),('lowerarm01.L','X',-.12*(.5+.5*math.sin(phase*1.17)))]:
    bone=rig.pose.bones[name];bone.rotation_quaternion=Matrix.Rotation(angle,4,axis).to_quaternion();bone.keyframe_insert('rotation_quaternion',frame=frame,group=name)
  rig.animation_data.action.name=asset+' narrative '+str(i)
  if source=='patient':author_patient(rig,601)
  for layer in rig.animation_data.action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for curve in bag.fcurves:
      for key in curve.keyframe_points:key.interpolation='LINEAR'
 bpy.context.scene.frame_set(283);bpy.context.view_layer.update()
 bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(LOCAL/(asset+'-motion.blend')))
 bpy.ops.export_scene.gltf(filepath=str(OUT/(asset+'.glb')),export_format='GLB',export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_frame_step=3,export_force_sampling=True,export_skins=True,export_all_influences=False,export_morph=False,export_apply=False,export_extras=True)
 report.append({'asset':asset,'rigs':len(rigs),'vertices':sum(len(o.data.vertices) for o in meshes),'source':source+'-source.blend'})
 print('MOTION_EXPORT',report[-1])
(LOCAL/'export-report.json').write_text(json.dumps(report,indent=2))
