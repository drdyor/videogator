#!/usr/bin/env python3
"""
Local test script for Blender rendering
Tests the rendering pipeline without Docker or RunPod
"""

import json
import subprocess
import sys
import os

def test_render(pdb_id="4HJO", output_name="test"):
    """Test render a molecular structure"""
    
    # Check if Blender is installed
    try:
        result = subprocess.run(["blender", "--version"], 
                              capture_output=True, text=True)
        print("✓ Blender found:")
        print(result.stdout.split('\n')[0])
    except FileNotFoundError:
        print("✗ Blender not found. Install from https://www.blender.org/download/")
        sys.exit(1)
    
    # Create test config
    config = {
        "project_id": f"test_{output_name}",
        "pdb_id": pdb_id,
        "template": "ligand_binding",
        "params": {
            "primary_color": "#3B82F6",
            "background_color": "#FFFFFF",
            "duration": 3,  # Short test duration
            "animation_type": "rotation",
            "samples": 32,  # Low samples for fast testing
            "width": 1280,
            "height": 720
        }
    }
    
    # Write config
    config_path = f"/tmp/{output_name}_config.json"
    output_path = f"/tmp/{output_name}.mp4"
    
    with open(config_path, 'w') as f:
        json.dump(config, indent=2, fp=f)
    
    print(f"\n📋 Config saved to: {config_path}")
    print(f"📁 Output will be: {output_path}")
    
    # Get script path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    render_script = os.path.join(script_dir, "scripts", "molecular_render.py")
    
    if not os.path.exists(render_script):
        print(f"✗ Render script not found: {render_script}")
        sys.exit(1)
    
    print(f"\n🎬 Starting render...")
    print(f"   PDB: {pdb_id}")
    print(f"   Duration: {config['params']['duration']}s")
    print(f"   Resolution: {config['params']['width']}x{config['params']['height']}")
    print(f"   Samples: {config['params']['samples']}")
    print()
    
    # Run Blender
    cmd = [
        "blender",
        "-b",  # background mode
        "--python", render_script,
        "--",
        config_path,
        output_path
    ]
    
    print(f"Running: {' '.join(cmd)}\n")
    print("=" * 80)
    
    result = subprocess.run(cmd)
    
    print("=" * 80)
    
    if result.returncode == 0:
        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(f"\n✓ Render complete!")
            print(f"  Output: {output_path}")
            print(f"  Size: {size_mb:.2f} MB")
            print(f"\nOpen with: open {output_path}")
        else:
            print(f"\n✗ Render completed but output file not found: {output_path}")
            return False
    else:
        print(f"\n✗ Render failed with exit code: {result.returncode}")
        return False
    
    return True

if __name__ == "__main__":
    # Parse arguments
    pdb_id = sys.argv[1] if len(sys.argv) > 1 else "4HJO"
    output_name = sys.argv[2] if len(sys.argv) > 2 else "test"
    
    print("🧬 Blender Pharma MOA Renderer - Local Test")
    print("=" * 80)
    
    success = test_render(pdb_id, output_name)
    
    sys.exit(0 if success else 1)
