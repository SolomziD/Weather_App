#!/usr/bin/env bash
# ─────────────────────────────────────────
#  Nimbus Weather App — Start Script
# ─────────────────────────────────────────
set -e

cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
pip install -r requirements.txt --break-system-packages -q

echo ""
echo "🌤  Starting Nimbus Weather App..."
echo "    Local:  http://localhost:8000"
echo "    Quit:   Ctrl+C"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
