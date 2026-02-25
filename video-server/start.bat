@echo off
REM Start script for Local Video Generation Server (Windows)

echo ========================================
echo Local Video Generation Server
echo ========================================

REM Check for NVIDIA GPU
nvidia-smi >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] NVIDIA GPU detected:
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
) else (
    echo [WARN] No NVIDIA GPU detected, will use CPU (slower)
)

REM Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.10+
    exit /b 1
)

REM Create virtual environment if not exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
python -m pip install --upgrade pip

REM Check for GPU and install appropriate PyTorch
nvidia-smi >nul 2>&1
if %errorlevel% equ 0 (
    echo Installing PyTorch with CUDA support...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
) else (
    echo Installing PyTorch (CPU version)...
    pip install torch torchvision
)

REM Install other requirements
pip install -r requirements.txt

REM Create output directory
if not exist "C:\temp\video-output" mkdir "C:\temp\video-output"

REM Set environment variable for output
set OUTPUT_DIR=C:\temp\video-output

REM Start the server
echo.
echo Starting server on http://0.0.0.0:8001
python main.py
