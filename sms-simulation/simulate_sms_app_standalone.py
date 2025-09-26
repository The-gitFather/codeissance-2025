# simulate_sms_app_standalone.py
import os
import time
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from twilio.rest import Client
from dotenv import load_dotenv
from datetime import datetime

# Load env
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
PORT = int(os.getenv('PORT', 5050))

# Twilio client
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# FastAPI app
app = FastAPI(title="SMS Phishing Simulation API - Standalone Prototype")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# Simple rate limit (per phone)
RATE_LIMIT_MAX_PER_HOUR = 10
_rate_store = {}

SIMULATION_MARKER = " [SIMULATION — SECURITY TRAINING]"

# realistic-looking prototype templates (for authorized simulations only)
TEMPLATES = {
    "password-reset": (
        "Alert: We detected unusual sign-in activity on your account. "
        "If this wasn't you, reset your password immediately at https://example.com/reset"
    ),
    "package-alert": (
        "Delivery Notification: Your package could not be delivered. "
        "Confirm your address and reschedule at https://example.com/track"
    ),
    "invoice-overdue": (
        "Invoice Reminder: Your invoice #12345 is overdue. "
        "Please pay by the due date to avoid service interruption. https://example.com/pay"
    ),
    "account-update": (
        "Action Required: Update your account information to continue using our services. "
        "Visit https://example.com/update to review and confirm your details."
    ),
    "verification-urgent": (
        "Urgent: Please verify your account within 24 hours to prevent temporary suspension. "
        "Go to https://example.com/verify to complete verification."
    ),
    "calendar-invite": (
        "You have a new calendar invite from external.sender@example.com. "
        "Review the meeting details here: https://example.com/calendar"
    ),
    "trial": (
        "Dear Mayuresh Chavan, "
        "You have been eliminated from Bit N Build 2025. Your malpractice has been detected and you have been eliminated from the hackathon. Kindly don't try to contact us."
    )
}


class SimulationRequest(BaseModel):
    to_phone: str = Field(..., description="E.164 formatted phone number of recipient")
    template_id: Optional[str] = Field(None)
    custom_message: Optional[str] = Field(None)
    consent: Optional[bool] = Field(False, description="Set true if recipient consented")
    note: Optional[str] = Field(None)

def _rate_limit_allow(phone: str) -> bool:
    entry = _rate_store.get(phone)
    now = int(time.time())
    if entry is None or now >= entry["reset_ts"]:
        _rate_store[phone] = {"count": 0, "reset_ts": now + 3600}
        entry = _rate_store[phone]
    if entry["count"] >= RATE_LIMIT_MAX_PER_HOUR:
        return False
    entry["count"] += 1
    return True

def send_sms_via_twilio(to_phone: str, message: str) -> dict:
    try:
        sms = twilio_client.messages.create(
            body=message, from_=TWILIO_PHONE_NUMBER, to=to_phone
        )
        logger.info(f"Sent SMS to {to_phone}. SID: {sms.sid}")
        return {"status": "sent", "sid": sms.sid}
    except Exception as e:
        logger.exception(f"Twilio error sending to {to_phone}: {e}")
        return {"status": "error", "error": str(e)}

@app.post("/api/simulate-sms")
async def simulate_sms(req: SimulationRequest):
    if not req.consent:
        raise HTTPException(
            status_code=403,
            detail="Recipient not authorized for simulation. Set consent=true for prototype.",
        )

    if not _rate_limit_allow(req.to_phone):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {req.to_phone}. Max {RATE_LIMIT_MAX_PER_HOUR} per hour.",
        )

    if req.template_id:
        print(req.template_id)
        message = TEMPLATES.get(req.template_id)
        if not message:
            raise HTTPException(
                status_code=400, detail=f"Unknown template_id: {req.template_id}"
            )
    else:
        if not req.custom_message:
            raise HTTPException(
                status_code=400,
                detail="Either template_id or custom_message must be provided.",
            )
        message = req.custom_message.strip()
        if SIMULATION_MARKER not in message:
            message += SIMULATION_MARKER

    send_result = send_sms_via_twilio(req.to_phone, message)

    record = {
        "to": req.to_phone,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": send_result.get("status"),
        "twilio_sid": send_result.get("sid"),
        "note": req.note or "",
    }

    return JSONResponse(
        status_code=200 if send_result.get("status") == "sent" else 500,
        content={"result": send_result, "record": record},
    )

@app.post("/api/send-advertisement")
async def send_advertisement(to_phone: str):
    to_phone = to_phone.strip()
    if not to_phone.startswith("+"):
        raise HTTPException(
            status_code=400,
            detail="Phone number must be in E.164 format starting with + and country code."
        )

    if not _rate_limit_allow(to_phone):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {to_phone}. Max {RATE_LIMIT_MAX_PER_HOUR} per hour.",
        )

    message = (
        "Hello! Join BrightMart store. Monday 3 PM. Details: call us at +91-1234567890"
    )

    send_result = send_sms_via_twilio(to_phone, message)

    record = {
        "to": to_phone,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": send_result.get("status"),
        "twilio_sid": send_result.get("sid"),
    }

    return JSONResponse(
        status_code=200 if send_result.get("status") == "sent" else 500,
        content={"result": send_result, "record": record},
    )


@app.get("/api/templates")
def list_templates():
    return {"templates": list(TEMPLATES.keys())}
  
  
  
if __name__ == "__main__":
  import uvicorn
  logger.info(f"Server starting on port {PORT}")
  uvicorn.run(app, host="0.0.0.0", port=PORT)
