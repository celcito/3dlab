#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

# Clonar TripoSR se não existir
TRIPOSR_DIR="$HOME/TripoSR"
if [ ! -d "$TRIPOSR_DIR" ]; then
    echo "Cloning TripoSR..."
    git clone --depth 1 https://github.com/VAST-AI-Research/TripoSR.git "$TRIPOSR_DIR"
fi

# NÃO instala o requirements.txt do TripoSR — pins velhos conflitam
# Apenas fixa as versões corretas no final
pip install \
    "huggingface-hub>=0.34.0,<2.0.0" \
    "transformers>=4.35.0,<4.45.0" \
    "tokenizers>=0.19.0"

export PYTHONPATH="$TRIPOSR_DIR:${PYTHONPATH:-}"

echo "Starting TripoSR API on port 8001..."
exec uvicorn app:app --host 127.0.0.1 --port 8001 --reload --log-level info