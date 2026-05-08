#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Install Python dependencies
pip install -r requirements.txt

# Run the Uvicorn server
uvicorn server:app --host 0.0.0.0 --port $PORT