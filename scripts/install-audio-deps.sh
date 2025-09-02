#!/usr/bin/env bash
set -euo pipefail

echo "[setup] Installing system audio build deps (PortAudio/ALSA)"

if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  sudo apt-get update -y
  sudo apt-get install -y --no-install-recommends \
    build-essential \
    portaudio19-dev \
    libasound2-dev \
    python3-dev \
    pkg-config
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y \
    gcc gcc-c++ make \
    portaudio-devel \
    alsa-lib-devel \
    python3-devel \
    pkgconf-pkg-config
elif command -v apk >/dev/null 2>&1; then
  sudo apk add --no-cache \
    build-base \
    portaudio-dev \
    alsa-lib-dev \
    python3-dev \
    pkgconf
elif command -v brew >/dev/null 2>&1; then
  brew list portaudio >/dev/null 2>&1 || brew install portaudio
else
  echo "[setup] Unsupported package manager. Please install PortAudio dev headers manually."
  exit 1
fi

echo "[setup] Audio dependencies installed. If you still see PyAudio build errors, run: pip install --no-build-isolation pyaudio"

