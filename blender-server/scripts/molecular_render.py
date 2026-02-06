"""
Blender Python script for rendering molecular animations
Uses MolecularNodes addon for PDB visualization
Creates entire scene from scratch - no template required
"""
import bpy
import sys
import json
import os
import math

print("=" * 80)
print("Blender Pharma MOA Renderer")
print("=" * 80)

# Ensure MolecularNodes is in path
addon_path = '/app/addons'
if addon_path not in sys.path:
    sys.path.append(addon_path)

# Try to import MolecularNodes (optional)
molecularnodes_available = False
try:
    import molecularnodes as mn
    molecularnodes_available = True
    print("✓ MolecularNodes loaded successfully")
except ImportError:
    print("⚠ MolecularNodes not found - will use fallback geometry")
    print("  Install from: https://github.com/BradyAJohnston/MolecularNodes")

# Parse command line arguments
argv = sys.argv
argv = argv[argv.index("--") + 1:]
config_path = argv[0]
output_path = argv[1]

print(f"Loading config from: {config_path}")
print(f"Output will be saved to: {output_path}")

# Load job configuration
with open(config_path) as f:
    config = json.load(f)

print(f"Config: {json.dumps(config, indent=2)}")

# Extract parameters
pdb_id = config['pdb_id']
template = config.get('template', 'default')
params = config.get('params', {})

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Camera and lighting setup
scene = bpy.context.scene

# Add camera
bpy.ops.object.camera_add(location=(20, -20, 15))
camera = bpy.context.object
camera.rotation_euler = (math.radians(63), 0, math.radians(51))
scene.camera = camera

# Add key light
bpy.ops.object.light_add(type='SUN', location=(10, -10, 20))
key_light = bpy.context.object
key_light.data.energy = 5.0

# Add fill light
bpy.ops.object.light_add(type='AREA', location=(-10, 10, 10))
fill_light = bpy.context.object
fill_light.data.energy = 3.0

# Load molecule using MolecularNodes (if available)
if molecularnodes_available:
    try:
        print(f"Fetching PDB structure: {pdb_id}")
        # Fetch molecule from PDB
        mol = mn.load.fetch(
            pdb_id, 
            style='cartoon',  # cartoon, ribbon, ball_stick, surface
            centre=True,
            cache_dir='/tmp/pdb'
        )
        print(f"✓ Loaded molecule: {pdb_id}")
        
    except Exception as e:
        print(f"✗ Error loading molecule {pdb_id}: {e}")
        print("Creating fallback geometry...")
        molecularnodes_available = False

# Create fallback geometry if MolecularNodes failed or not available
if not molecularnodes_available:
    print("Creating stylized molecular representation...")
    # Create a torus knot (looks like a protein structure)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=3,
        minor_radius=0.8,
        location=(0, 0, 0)
    )
    mol = bpy.context.object
    
    # Add subdivision for smooth look
    bpy.ops.object.modifier_add(type='SUBSURF')
    mol.modifiers["Subdivision"].levels = 2
    print("✓ Created fallback torus geometry")

# Apply custom material to molecule
mat = bpy.data.materials.new(name="ProteinMaterial")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

# Clear default nodes
for node in nodes:
    nodes.remove(node)

# Create shader nodes
output_node = nodes.new('ShaderNodeOutputMaterial')
bsdf_node = nodes.new('ShaderNodeBsdfPrincipled')

# Get color from params (default: blue)
hex_color = params.get('primary_color', '#3B82F6')
rgb = tuple(int(hex_color[i:i+2], 16)/255 for i in (1, 3, 5))
bsdf_node.inputs['Base Color'].default_value = (*rgb, 1.0)

# Material properties for nice pharma look
bsdf_node.inputs['Metallic'].default_value = 0.2
bsdf_node.inputs['Roughness'].default_value = 0.4
bsdf_node.inputs['Specular IOR Level'].default_value = 0.5

# Link nodes
links.new(bsdf_node.outputs['BSDF'], output_node.inputs['Surface'])

# Apply material to molecule
if mol.data.materials:
    mol.data.materials[0] = mat
else:
    mol.data.materials.append(mat)

print("✓ Applied material")

# Animation setup
duration = params.get('duration', 5)  # seconds
fps = 30
frames = duration * fps

scene.frame_start = 1
scene.frame_end = frames
scene.render.fps = fps

# Rotation animation
animation_type = params.get('animation_type', 'rotation')

if animation_type == 'rotation':
    # Full 360-degree rotation
    mol.rotation_euler = (0, 0, 0)
    mol.keyframe_insert(data_path="rotation_euler", frame=1)
    mol.rotation_euler = (0, 0, math.radians(360))
    mol.keyframe_insert(data_path="rotation_euler", frame=frames)
    
    # Set interpolation to linear
    for fcurve in mol.animation_data.action.fcurves:
        for keyframe in fcurve.keyframe_points:
            keyframe.interpolation = 'LINEAR'

elif animation_type == 'orbit':
    # Camera orbits around molecule
    camera_speed = params.get('camera_speed', 1.0)
    empty = bpy.data.objects.new("CameraTarget", None)
    scene.collection.objects.link(empty)
    empty.location = (0, 0, 0)
    
    camera.parent = empty
    camera.location = (20, 0, 5)
    camera.rotation_euler = (math.radians(80), 0, math.radians(90))
    
    empty.rotation_euler = (0, 0, 0)
    empty.keyframe_insert(data_path="rotation_euler", frame=1)
    empty.rotation_euler = (0, 0, math.radians(360 * camera_speed))
    empty.keyframe_insert(data_path="rotation_euler", frame=frames)

# Render settings
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'  # Use GPU if available
scene.cycles.samples = params.get('samples', 128)
scene.render.resolution_x = params.get('width', 1920)
scene.render.resolution_y = params.get('height', 1080)
scene.render.resolution_percentage = 100

# Output settings
scene.render.filepath = output_path
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.ffmpeg.ffmpeg_preset = 'GOOD'

# World settings (background)
world = scene.world
world.use_nodes = True
bg_node = world.node_tree.nodes.get('Background')
if bg_node:
    bg_color = params.get('background_color', '#FFFFFF')
    bg_rgb = tuple(int(bg_color[i:i+2], 16)/255 for i in (1, 3, 5))
    bg_node.inputs['Color'].default_value = (*bg_rgb, 1.0)
    bg_node.inputs['Strength'].default_value = 1.0

print("Starting render...")
print(f"Frames: {frames}, Resolution: {scene.render.resolution_x}x{scene.render.resolution_y}")
print(f"Samples: {scene.cycles.samples}, Engine: {scene.render.engine}")

# Render animation
bpy.ops.render.render(animation=True, write_still=False)

print(f"Render completed: {output_path}")
