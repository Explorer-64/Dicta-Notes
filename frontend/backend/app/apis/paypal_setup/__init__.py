import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("dicta.paypal_setup")
from app.libs.secret_manager import get_secret
import requests
import json

router = APIRouter()

class PlanInfo(BaseModel):
    plan_id: str
    product_id: str
    name: str
    price: str

class SetupResponse(BaseModel):
    success: bool
    plans: list[PlanInfo]
    message: str

def get_paypal_access_token():
    """Get PayPal OAuth access token"""
    client_id = get_secret("PAYPAL_CLIENT_ID")
    client_secret = get_secret("PAYPAL_CLIENT_SECRET")
    
    url = "https://api-m.paypal.com/v1/oauth2/token"
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
    }
    data = {
        "grant_type": "client_credentials"
    }
    
    response = requests.post(
        url,
        headers=headers,
        data=data,
        auth=(client_id, client_secret)
    )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get PayPal access token: {response.text}"
        )
    
    return response.json()["access_token"]

def create_product(access_token: str, name: str, description: str):
    """Create a PayPal product"""
    url = "https://api-m.paypal.com/v1/catalogs/products"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    payload = {
        "name": name,
        "description": description,
        "type": "SERVICE",
        "category": "SOFTWARE"
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in [200, 201]:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create product {name}: {response.text}"
        )
    
    return response.json()["id"]

def create_billing_plan(access_token: str, product_id: str, name: str, price: str):
    """Create a PayPal billing plan"""
    url = "https://api-m.paypal.com/v1/billing/plans"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    payload = {
        "product_id": product_id,
        "name": name,
        "description": f"Monthly subscription for {name}",
        "billing_cycles": [
            {
                "frequency": {
                    "interval_unit": "MONTH",
                    "interval_count": 1
                },
                "tenure_type": "REGULAR",
                "sequence": 1,
                "total_cycles": 0,  # Infinite
                "pricing_scheme": {
                    "fixed_price": {
                        "value": price,
                        "currency_code": "USD"
                    }
                }
            }
        ],
        "payment_preferences": {
            "auto_bill_outstanding": True,
            "setup_fee": {
                "value": "0",
                "currency_code": "USD"
            },
            "setup_fee_failure_action": "CONTINUE",
            "payment_failure_threshold": 3
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in [200, 201]:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create billing plan for {name}: {response.text}"
        )
    
    return response.json()["id"]

@router.post("/setup-paypal-plans")
def setup_paypal_plans() -> SetupResponse:
    """
    Create all subscription plans in PayPal.
    This only needs to be run once during initial setup.
    """
    try:
        # Get access token
        access_token = get_paypal_access_token()
        
        plans_config = [
            {
                "name": "Dicta-Notes Individual",
                "description": "Individual plan with basic features",
                "price": "4.99"
            },
            {
                "name": "Dicta-Notes Professional",
                "description": "Professional plan with advanced features",
                "price": "9.99"
            },
            {
                "name": "Dicta-Notes Business",
                "description": "Business plan with premium features and team sharing",
                "price": "49.99"
            }
        ]
        
        created_plans = []
        
        for plan_config in plans_config:
            logger.info("Creating product: %s", plan_config['name'])
            
            # Create product
            product_id = create_product(
                access_token,
                plan_config["name"],
                plan_config["description"]
            )
            
            logger.info("Product created with ID: %s", product_id)
            
            # Create billing plan
            plan_id = create_billing_plan(
                access_token,
                product_id,
                plan_config["name"],
                plan_config["price"]
            )
            
            logger.info("Billing plan created with ID: %s", plan_id)
            
            created_plans.append(PlanInfo(
                plan_id=plan_id,
                product_id=product_id,
                name=plan_config["name"],
                price=plan_config["price"]
            ))
        
        return SetupResponse(
            success=True,
            plans=created_plans,
            message="Successfully created all subscription plans!"
        )
        
    except Exception as e:
        logger.error("Error setting up PayPal plans: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to set up PayPal plans: {str(e)}"
        )
