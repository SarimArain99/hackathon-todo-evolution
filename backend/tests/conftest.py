"""
Test configuration for FastAPI tests.

Sets up test environment before any imports happen.
"""

import os
import sys

# Set test database URL BEFORE importing anything from the app
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

# Also need to make sure we don't load the parent .env file
# by changing the current directory to backend
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, os.path.dirname(backend_dir))
