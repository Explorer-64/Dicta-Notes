import logging
from fastapi import APIRouter, HTTPException
import re

logger = logging.getLogger("dicta.modules")
from app.libs.storage_manager import get_json as storage_get_json, put_json as storage_put_json
from typing import Dict, List, Optional
from pydantic import BaseModel

router = APIRouter()

class ModuleItem(BaseModel):
    id: str
    name: str
    description: str
    required: bool

class ModuleResponse(BaseModel):
    modules: List[ModuleItem]

class UserModuleResponse(BaseModel):
    modules: Dict[str, bool]

class ModuleStatusResponse(BaseModel):
    success: bool
    module: str

class ModuleAccess:
    def __init__(self):
        # Core modules that are always available
        self.core_modules = ["core", "transcription", "speakerIdentification"]
        # All available modules for default enablement
        self.all_modules = [
            "core", "transcription", "speakerIdentification", 
            "recording", "persistence", "audioPlayback", 
            "voiceSynthesis", "translation"
        ]
    
    def get_user_modules(self, user_id: Optional[str] = None) -> dict:
        """Get the modules enabled for a specific user
        
        Default: All modules are enabled by default for new users.
        Existing users preserve their current configuration.
        """
        if not user_id:
            # No user ID - return all modules enabled for public/anonymous access
            return {module: True for module in self.all_modules}
            
        sanitized_key = re.sub(r'[^a-zA-Z0-9._-]', '', f"user_modules_{user_id}")
        try:
            modules = storage_get_json(sanitized_key, default=None)
            
            # If no existing configuration found, enable all modules by default
            if modules is None:
                logger.info("New user detected: %s. Enabling all modules by default", user_id)
                default_modules = {module: True for module in self.all_modules}
                # Save the default configuration for the user
                storage_put_json(sanitized_key, default_modules)
                return default_modules
            
            # Existing user - preserve their configuration but ensure core modules are enabled
            for module in self.core_modules:
                modules[module] = True
                
            return modules
        except Exception as e:
            logger.warning("Error retrieving user modules: %s", e)
            # Default to all modules enabled
            return {module: True for module in self.all_modules}
    
    def has_module_access(self, user_id: Optional[str], module_name: str) -> bool:
        """Check if a user has access to a specific module"""
        if module_name in self.core_modules:
            return True
            
        modules = self.get_user_modules(user_id)
        return modules.get(module_name, False)
    
    def enable_module(self, user_id: Optional[str], module_name: str) -> bool:
        """Enable a module for a user"""
        if not user_id:
            return False
            
        sanitized_key = re.sub(r'[^a-zA-Z0-9._-]', '', f"user_modules_{user_id}")
        try:
            modules = self.get_user_modules(user_id)
            modules[module_name] = True
            storage_put_json(sanitized_key, modules)
            return True
        except Exception as e:
            logger.warning("Error enabling module: %s", e)
            return False

    def disable_module(self, user_id: Optional[str], module_name: str) -> bool:
        """Disable a module for a user"""
        if not user_id or module_name in self.core_modules:
            return False
            
        sanitized_key = re.sub(r'[^a-zA-Z0-9._-]', '', f"user_modules_{user_id}")
        try:
            modules = self.get_user_modules(user_id)
            modules[module_name] = False
            storage_put_json(sanitized_key, modules)
            return True
        except Exception as e:
            logger.warning("Error disabling module: %s", e)
            return False

# Create singleton instance
module_access = ModuleAccess()

@router.get("/modules", response_model=ModuleResponse)
def list_available_modules():
    """List all available modules in the system"""
    return ModuleResponse(
        modules=[
            ModuleItem(id="core", name="Core Transcription", description="Basic meeting transcription capabilities", required=True),
            ModuleItem(id="recording", name="Meeting Recording", description="Record and export meeting transcripts", required=False),
            ModuleItem(id="persistence", name="Session Persistence", description="Save and resume meeting sessions", required=False),
            ModuleItem(id="audioPlayback", name="Audio Playback & Visualization", description="Visualize and play audio recordings with waveform visualization", required=False),
            ModuleItem(id="voiceSynthesis", name="Voice Synthesis", description="Convert text to speech for spoken translations", required=False),
            ModuleItem(id="translation", name="Multilingual Translation", description="Translate meetings between multiple languages", required=False)
        ]
    )

@router.get("/modules/user/{user_id}", response_model=UserModuleResponse)
def get_user_modules(user_id: str):
    """Get modules enabled for a specific user"""
    return UserModuleResponse(modules=module_access.get_user_modules(user_id))

@router.post("/modules/user/{user_id}/enable/{module_id}", response_model=ModuleStatusResponse)
def enable_user_module(user_id: str, module_id: str):
    """Enable a module for a user"""
    success = module_access.enable_module(user_id, module_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to enable module")
    return ModuleStatusResponse(success=True, module=module_id)

@router.post("/modules/user/{user_id}/disable/{module_id}", response_model=ModuleStatusResponse)
def disable_user_module(user_id: str, module_id: str):
    """Disable a module for a user"""
    success = module_access.disable_module(user_id, module_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to disable module or module is required")
    return ModuleStatusResponse(success=True, module=module_id)
