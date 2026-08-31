#!/bin/bash
# AI Interview Coach - double-click this file in Finder (macOS) to set up
# and launch the app, or run it from a terminal on macOS/Linux with
# `./setup.command`. See README.md "Quick start" for details.
set -e
cd "$(dirname "$0")"

echo "=== AI Interview Coach setup ==="
echo

pause_and_exit() {
  echo
  read -r -p "Press Enter to close this window..."
  exit "${1:-1}"
}

# 1. Check Node.js is installed.
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found on this computer."
  echo "This app needs Node.js 20.9 or newer to run."
  echo "Download and install it from https://nodejs.org (choose the LTS version), then run this script again."
  pause_and_exit 1
fi

# 2. Check the Node.js version meets Next.js's minimum (20.9.0).
NODE_VERSION=$(node -v | sed 's/^v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
NODE_MINOR=$(echo "$NODE_VERSION" | cut -d. -f2)
if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 9 ]; }; then
  echo "Found Node.js v$NODE_VERSION, but this app needs v20.9.0 or newer."
  echo "Update Node.js from https://nodejs.org (choose the LTS version), then run this script again."
  pause_and_exit 1
fi
echo "Node.js v$NODE_VERSION found."

# 3. Install dependencies the first time (or after a fresh clone).
if [ ! -d "node_modules" ]; then
  echo
  echo "Installing dependencies (this happens once, may take a minute)..."
  if ! npm install; then
    echo "npm install failed - see the errors above."
    pause_and_exit 1
  fi
else
  echo "Dependencies already installed."
fi

# 4. Build a production bundle the first time (or after a fresh clone).
#    This is a real production build (npm run build), not `next dev` - no
#    dev-only error overlay, no React dev warnings, and a faster, optimized
#    load. If you've edited the source and want to pick up changes, delete
#    the `out` folder and re-run this script.
if [ ! -d "out" ]; then
  echo
  echo "Building the app (this happens once, may take a minute)..."
  if ! npm run build; then
    echo "Build failed - see the errors above."
    pause_and_exit 1
  fi
else
  echo "Already built."
fi

# 5. Open the browser a couple seconds after the server starts (it starts
#    almost instantly, since the build already happened above), in the
#    background, so this window can keep showing server logs.
(
  sleep 2
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000"          # macOS
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000"      # Linux
  fi
) &

echo
echo "Starting the app - this window must stay open while you use it."
echo "Your browser will open automatically. Press Ctrl+C here to stop."
echo

npx serve@latest out -l 3000
