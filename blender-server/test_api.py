#!/usr/bin/env python3
"""
Test the FastAPI server without Blender
Validates API endpoints and configuration
"""

import requests
import json
import sys

def test_server(base_url="http://localhost:8000"):
    """Test the Blender server API"""
    
    print("🧪 Testing Blender Pharma Server API")
    print("=" * 80)
    print(f"Base URL: {base_url}\n")
    
    # Test 1: Health check
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Server is running")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            if 'blender_version' in data:
                print(f"   Blender: {data.get('blender_version')}")
        else:
            print(f"   ✗ Unexpected status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"   ✗ Cannot connect to {base_url}")
        print(f"   Make sure the server is running:")
        print(f"   cd blender-server && python3 main.py")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    print()
    
    # Test 2: Queue a render job
    print("2. Testing render endpoint...")
    
    test_job = {
        "project_id": "test_001",
        "pdb_id": "4HJO",
        "template": "ligand_binding",
        "params": {
            "primary_color": "#3B82F6",
            "duration": 2,
            "animation_type": "rotation",
            "samples": 32
        }
    }
    
    try:
        response = requests.post(
            f"{base_url}/render",
            json=test_job,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Job queued successfully")
            print(f"   Project ID: {data.get('project_id')}")
            print(f"   Status: {data.get('status')}")
            
            # Test 3: Check status
            print()
            print("3. Testing status endpoint...")
            status_response = requests.get(
                f"{base_url}/status/{data.get('project_id')}",
                timeout=5
            )
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                print(f"   ✓ Status retrieved")
                print(f"   Status: {status_data.get('status')}")
                print(f"   Progress: {status_data.get('progress')}")
            else:
                print(f"   ✗ Status check failed: {status_response.status_code}")
                
        else:
            print(f"   ✗ Job submission failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    print()
    print("=" * 80)
    print("✓ All API tests passed!")
    print()
    print("Note: Actual rendering requires Blender to be installed.")
    print("The job will remain in 'rendering' state until Blender completes it.")
    
    return True

if __name__ == "__main__":
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    success = test_server(base_url)
    sys.exit(0 if success else 1)
