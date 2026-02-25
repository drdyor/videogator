#!/usr/bin/env python3
"""
Test script for Local Video Generation Server
Run this to verify the server is working correctly.
"""

import requests
import time
import sys
import os
from pathlib import Path

# Configuration
SERVER_URL = os.getenv("VIDEO_SERVER_URL", "http://localhost:8001")
OUTPUT_DIR = Path("test_output")
OUTPUT_DIR.mkdir(exist_ok=True)


def test_health():
    """Test server health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{SERVER_URL}/health", timeout=5)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Server is healthy")
        print(f"   Device: {data.get('device')}")
        print(f"   GPU Available: {data.get('gpu_available')}")
        if data.get('vram_gb'):
            print(f"   VRAM: {data.get('vram_gb'):.1f} GB")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False


def test_models():
    """Test models endpoint"""
    print("\n🔍 Testing models endpoint...")
    try:
        response = requests.get(f"{SERVER_URL}/models", timeout=5)
        response.raise_for_status()
        models = response.json()
        print(f"✅ Available models:")
        for model_id, config in models.items():
            print(f"   - {model_id}: {config['name']} ({config['default_width']}x{config['default_height']})")
        return True
    except Exception as e:
        print(f"❌ Models check failed: {e}")
        return False


def test_generate_fast():
    """Test fast video generation with ModelScope"""
    print("\n🔍 Testing fast generation (ModelScope)...")
    
    payload = {
        "prompt": "A cat playing with a ball of yarn",
        "model": "modelscope",
        "width": 256,
        "height": 256,
        "num_frames": 16,
        "num_inference_steps": 15,
        "fps": 8
    }
    
    try:
        # Start generation
        response = requests.post(f"{SERVER_URL}/generate", json=payload, timeout=30)
        response.raise_for_status()
        job = response.json()
        job_id = job["job_id"]
        print(f"   Job ID: {job_id}")
        print(f"   Status: {job['status']}")
        
        # Poll for completion
        start_time = time.time()
        while True:
            time.sleep(2)
            status_response = requests.get(f"{SERVER_URL}/status/{job_id}", timeout=5)
            status_response.raise_for_status()
            status = status_response.json()
            
            elapsed = time.time() - start_time
            print(f"   [{elapsed:.0f}s] Status: {status['status']}, Progress: {status['progress']*100:.0f}%")
            
            if status["status"] == "completed":
                # Download the video
                output_url = f"{SERVER_URL}{status['output_url']}"
                video_response = requests.get(output_url, timeout=30)
                video_response.raise_for_status()
                
                output_path = OUTPUT_DIR / f"test_{job_id}.mp4"
                output_path.write_bytes(video_response.content)
                print(f"✅ Video saved to: {output_path}")
                print(f"   Total time: {elapsed:.1f}s")
                return True
            
            if status["status"] == "failed":
                print(f"❌ Generation failed: {status.get('error')}")
                return False
            
            if elapsed > 300:  # 5 minute timeout
                print(f"❌ Timeout after {elapsed:.0f}s")
                return False
                
    except Exception as e:
        print(f"❌ Generation test failed: {e}")
        return False


def test_ollama_endpoint():
    """Test Ollama-compatible endpoint"""
    print("\n🔍 Testing Ollama-compatible endpoint...")
    
    payload = {
        "model": "modelscope",
        "prompt": "A dog running in a park",
        "width": 256,
        "height": 256,
        "num_frames": 16,
        "num_inference_steps": 15
    }
    
    try:
        response = requests.post(f"{SERVER_URL}/ollama/generate", json=payload, timeout=300)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Ollama endpoint working")
        print(f"   Job ID: {data.get('job_id')}")
        print(f"   Output URL: {data.get('output_url')}")
        return True
    except Exception as e:
        print(f"❌ Ollama endpoint test failed: {e}")
        return False


def main():
    print("=" * 60)
    print("Local Video Generation Server - Test Suite")
    print("=" * 60)
    print(f"Server URL: {SERVER_URL}")
    print()
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    results.append(("Models List", test_models()))
    
    # Only run generation tests if server is healthy
    if results[0][1]:
        results.append(("Fast Generation", test_generate_fast()))
        # results.append(("Ollama Endpoint", test_ollama_endpoint()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! The video server is ready to use.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the server logs for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
