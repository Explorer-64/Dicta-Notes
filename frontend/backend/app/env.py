"""Usage:

from app.env import Mode, mode

if mode == Mode.PROD:
    print("Running in deployed service")
else:
    print("Running in development workspace")
"""

import os
from enum import Enum


class Mode(str, Enum):
    DEV = "development"
    PROD = "production"


# Detect production mode from Cloud Run environment or explicit setting.
# Note: GOOGLE_CLOUD_PROJECT is NOT used here - it's set for local backend config
# and would incorrectly trigger PROD mode during development.
mode = Mode.PROD if (
    os.environ.get("K_SERVICE") or  # Cloud Run sets K_SERVICE
    os.environ.get("DATABUTTON_SERVICE_TYPE") == "prodx"  # Legacy Databutton check
) else Mode.DEV

__all__ = [
    "Mode",
    "mode",
]
