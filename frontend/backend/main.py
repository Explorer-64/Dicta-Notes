import os
import sys
import logging
import pathlib
import json
import dotenv
from fastapi import FastAPI, APIRouter, Depends
from starlette.middleware.cors import CORSMiddleware

# Fix Windows cp1252 encoding crash when print() contains emoji characters
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

dotenv.load_dotenv()

# ---------------------------------------------------------------------------
# Structured logging for the entire application
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
# Quiet noisy third-party loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("google").setLevel(logging.WARNING)
logging.getLogger("firebase_admin").setLevel(logging.WARNING)

logger = logging.getLogger("dicta.main")

from databutton_app.mw.auth_mw import AuthConfig, get_authorized_user


def get_router_config() -> dict:
    try:
        cfg = json.loads(open("routers.json").read())
    except Exception:
        logger.warning("Could not load routers.json")
        return False
    return cfg


def is_auth_disabled(router_config: dict, name: str) -> bool:
    return router_config["routers"][name]["disableAuth"]


def import_api_routers() -> APIRouter:
    """Create top level router including all user defined endpoints."""
    routes = APIRouter(prefix="/routes")

    router_config = get_router_config()

    src_path = pathlib.Path(__file__).parent

    # Import API routers from "src/app/apis/*/__init__.py"
    apis_path = src_path / "app" / "apis"

    api_names = [
        p.relative_to(apis_path).parent.as_posix()
        for p in apis_path.glob("*/__init__.py")
    ]

    api_module_prefix = "app.apis."

    loaded = 0
    for name in api_names:
        try:
            api_module = __import__(api_module_prefix + name, fromlist=[name])
            api_router = getattr(api_module, "router", None)
            if isinstance(api_router, APIRouter):
                routes.include_router(
                    api_router,
                    dependencies=(
                        []
                        if is_auth_disabled(router_config, name)
                        else [Depends(get_authorized_user)]
                    ),
                )
                loaded += 1
        except Exception as e:
            logger.error("Failed to import API %s: %s", name, e)
            continue

    logger.info("Loaded %d API routers", loaded)

    return routes


def get_firebase_config() -> dict | None:
    # Try to get Firebase config from environment variable first
    firebase_config_str = os.environ.get("FIREBASE_CONFIG")
    if firebase_config_str:
        try:
            return json.loads(firebase_config_str)
        except json.JSONDecodeError:
            logger.error("Error parsing FIREBASE_CONFIG environment variable")

    # Fallback: try parsing from DATABUTTON_EXTENSIONS for backward compatibility
    extensions = os.environ.get("DATABUTTON_EXTENSIONS", "[]")
    try:
        extensions = json.loads(extensions)
        for ext in extensions:
            if ext["name"] == "firebase-auth":
                return ext["config"]["firebaseConfig"]
    except json.JSONDecodeError:
        logger.error("Error parsing DATABUTTON_EXTENSIONS")

    return None


def create_app() -> FastAPI:
    """Create the app. This is called by uvicorn with the factory option to construct the app object."""
    app = FastAPI()

    # CORS: required for production - browser API calls fail without this
    allowed_origins = os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://dicta-notes.web.app,https://dicta-notes.firebaseapp.com"
    ).split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in allowed_origins if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(import_api_routers())

    firebase_config = get_firebase_config()

    if firebase_config is None:
        logger.warning("No firebase config found - auth will not work")
        app.state.auth_config = None
    else:
        logger.info("Firebase auth configured for project: %s", firebase_config.get("projectId"))
        auth_config = {
            "jwks_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
            "audience": firebase_config["projectId"],
            "header": "authorization",
        }

        app.state.auth_config = AuthConfig(**auth_config)

    @app.on_event("startup")
    async def validate_startup():
        """Validate required configuration before accepting traffic."""
        from app.env import mode, Mode
        missing = []
        # Critical for Firebase (auth, Firestore, Storage) - check env or Secret Manager
        has_firebase_sa = bool(os.environ.get("FIREBASE_SERVICE_ACCOUNT"))
        if not has_firebase_sa and mode == Mode.PROD:
            try:
                from app.libs.secret_manager import get_secret
                has_firebase_sa = bool(get_secret("FIREBASE_SERVICE_ACCOUNT"))
            except Exception:
                pass
        if not has_firebase_sa:
            missing.append("FIREBASE_SERVICE_ACCOUNT")
        if not os.environ.get("FIREBASE_CONFIG") and not os.environ.get("DATABUTTON_EXTENSIONS"):
            missing.append("FIREBASE_CONFIG or DATABUTTON_EXTENSIONS (for auth)")
        if missing and mode == Mode.PROD:
            logger.critical("Missing required config: %s. App cannot start.", ", ".join(missing))
            sys.exit(1)
        elif missing:
            logger.warning("Missing optional config in dev: %s", ", ".join(missing))

    return app


app = create_app()
