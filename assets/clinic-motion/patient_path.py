"""Authored patient choreography on the retained seated-bind skeleton.
Coordinates are Blender meters, facing -Y. Runtime anchor remains (2.65,4.35), yaw PI.
No wall changes: arrival and onward departure stay in internal circulation.
"""
import math
from mathutils import Matrix,Vector

def smooth(t):
 t=max(0,min(1,t));return t*t*(3-2*t)

# Existing corridor openings: x=+-1.35, z=2.75..3.70. The reception
# approach stays on the clear side of its open leaf, furniture and staff.
ARRIVAL=[(0,5.0),(0,3.35),(-1.70,3.35)]
CONSULT=[(-1.70,3.35),(0,3.35),(1.35,3.35),(1.95,3.35),(2.65,3.97)]
DEPART=[(2.65,3.97),(1.95,3.35),(0,3.35),(0,-.4),(0,-3.2)]

def path_pose(path,t):
 lengths=[math.dist(a,b) for a,b in zip(path,path[1:])];distance=max(0,min(1,t))*sum(lengths);d=distance
 for i,length in enumerate(lengths):
  if d<=length or i==len(lengths)-1:
   a,b=path[i],path[i+1];u=d/length
   x=a[0]+(b[0]-a[0])*u;z=a[1]+(b[1]-a[1])*u
   yaw=math.atan2(b[0]-a[0],b[1]-a[1])
   return x,z,yaw,distance
  d-=length

def point(rig,name,head,direction):
 bone=rig.pose.bones[name];rest=bone.bone
 q=(rest.tail_local-rest.head_local).normalized().rotation_difference(direction.normalized())
 bone.matrix=Matrix.Translation(head)@q.to_matrix().to_4x4()@rest.matrix_local.to_quaternion().to_matrix().to_4x4()
 # Force parent chain evaluation; Blender pose matrix setters otherwise read
 # stale parent inverses for the next split segment.
 import bpy
 bpy.context.view_layer.update()
 return bone.tail.copy()

def leg(rig,side,ankle,foot_rest):
 hip=rig.pose.bones['upperleg01.'+side].head.copy()
 upper=sum(rig.pose.bones[p+side].length for p in ['upperleg01.','upperleg02.'])
 lower=sum(rig.pose.bones[p+side].length for p in ['lowerleg01.','lowerleg02.'])
 axis=(ankle-hip).normalized();distance=(ankle-hip).length
 along=(upper*upper-lower*lower+distance*distance)/(2*distance)
 pole=Vector((0,-1,0));pole=(pole-axis*pole.dot(axis)).normalized()
 knee=hip+axis*along+pole*math.sqrt(max(0,upper*upper-along*along))
 head=hip
 for prefix in ['upperleg01.','upperleg02.']:head=point(rig,prefix+side,head,knee-hip)
 for prefix in ['lowerleg01.','lowerleg02.']:head=point(rig,prefix+side,head,ankle-knee)
 foot=rig.pose.bones['foot.'+side];foot.matrix=Matrix.Translation(head)@foot_rest.to_quaternion().to_matrix().to_4x4()

def author_patient(rig,frame_end):
 import bpy
 rest={b.name:b.bone.matrix_local.copy() for b in rig.pose.bones}
 base_location=rig.location.copy()
 animated=['root','upperleg01.L','upperleg02.L','lowerleg01.L','lowerleg02.L','foot.L','upperleg01.R','upperleg02.R','lowerleg01.R','lowerleg02.R','foot.R','upperarm01.L','upperarm01.R']
 for frame in range(1,frame_end+1,3):
  p=(frame-1)/(frame_end-1)
  for name in animated:rig.pose.bones[name].matrix_basis=Matrix.Identity(4)
  rig.location=base_location;rig.rotation_euler=(0,0,0)
  seated=.43<=p<=.60
  transition=.40<=p<.43 or .60<p<.63
  if seated:continue
  if transition:
   stand=1-smooth((p-.40)/.03) if p<.43 else smooth((p-.60)/.03)
   x,z,yaw,distance=2.65,4.35,math.pi,0
   root_shift=Vector((0,-.38*stand,.34*stand));gait=0
  else:
   stand=1;root_shift=Vector((0,0,.34))
   if p<.27:x,z,yaw,distance=path_pose(ARRIVAL,(p-.19)/.08);gait=1 if .19<p<.27 else 0
   elif p<.32:x,z,yaw,distance=-1.70,3.35,-math.pi/2,0;gait=0
   elif p<.40:
    x,z,yaw,distance=path_pose(CONSULT,(p-.32)/.08);gait=1
    # Finish the turn while still in the open approach, not in a single
    # discontinuous frame when the planted-foot sit transition begins.
    yaw+=(math.pi-yaw)*smooth((p-.386)/.014)
   else:x,z,yaw,distance=path_pose(DEPART,(p-.63)/.15);gait=1 if p<.78 else 0
  # Existing loader rotates the asset PI: worldX = 2.65-localX,
  # worldZ = 4.35+localY. Preserve the source floor normalization.
  rig.location=base_location+Vector((2.65-x,z-4.35,0));rig.rotation_euler.z=yaw-math.pi
  root=rig.pose.bones['root'];root.matrix=Matrix.Translation(root_shift)@rest['root'];bpy.context.view_layer.update()
  for side,offset in [('L',0),('R',.5)]:
   foot=rest['foot.'+side].translation.copy()
   if not transition:
    phase=(distance/.8+offset)%1
    if gait:
     if phase<.5:foot.y=-.20+.8*phase;lift=0
     else:u=(phase-.5)*2;foot.y=.20-.4*smooth(u);lift=.065*math.sin(math.pi*u)
    else:foot.y=-.05;lift=0
    foot.z+=lift
   leg(rig,side,foot,rest['foot.'+side])
  for side,sign in [('L',1),('R',-1)]:
   bone=rig.pose.bones['upperarm01.'+side]
   # Small opposite arm swing, relaxed elbows retain accepted shape.
   bone.rotation_quaternion=Matrix.Rotation(sign*.10*math.sin(distance/.8*math.tau)*gait,4,'X').to_quaternion()
  for name in animated:
   bone=rig.pose.bones[name]
   for channel in ['location','rotation_quaternion','scale']:bone.keyframe_insert(channel,frame=frame,group=name)
  rig.keyframe_insert('location',frame=frame);rig.keyframe_insert('rotation_euler',frame=frame)
 # Explicit accepted anchor keys are essential: skipping seated frames would
 # interpolate straight between sit-down and get-up and never reach the chair.
 for frame in [259,280,301,340,361]:
  rig.location=base_location;rig.rotation_euler=(0,0,0)
  for name in animated:
   bone=rig.pose.bones[name];bone.matrix_basis=Matrix.Identity(4)
   for channel in ['location','rotation_quaternion','scale']:bone.keyframe_insert(channel,frame=frame,group=name)
  rig.keyframe_insert('location',frame=frame);rig.keyframe_insert('rotation_euler',frame=frame)
