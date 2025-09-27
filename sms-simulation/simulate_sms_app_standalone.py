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

# Add these imports near the top of your file (if not already present)
from typing import Any, List, Union
from pydantic import BaseModel
from fastapi import Body

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



# New Pydantic model for the tracking request
class TrackScheduleRequest(BaseModel):
    to_phone: str
    person_name: str
    schedule: List[Any]  # Accept the array you provided; we'll validate/proc in code
    consent: bool = False
    note: Union[str, None] = None

def _format_person_day_entry(day_obj: dict, person: str) -> str:
    """
    Given a day object like {"day": 0, "schedule": [...] } or schedule == "HOLIDAY",
    return a one-line human friendly string for that person for that day.
    """
    day_index = day_obj.get("day")
    sched = day_obj.get("schedule")

    if isinstance(sched, str) and sched.upper() == "HOLIDAY":
        return f"Day {day_index}: HOLIDAY"

    # sched expected to be a list of shift objects
    if not isinstance(sched, list):
        return f"Day {day_index}: (invalid schedule format)"

    # find shifts where person is present
    present_shifts = []
    for shift_obj in sched:
        # shift_obj expected like {"shift": 0, "workers": ["Name", ...]}
        shift_id = shift_obj.get("shift")
        workers = shift_obj.get("workers") or []
        # Normalize strings to compare
        # Accept case-insensitive matching and strip spaces
        normalized_workers = [w.strip().lower() for w in workers if isinstance(w, str)]
        if person.strip().lower() in normalized_workers:
            # list coworkers (excluding the person)
            coworkers = [w for w in workers if isinstance(w, str) and w.strip().lower() != person.strip().lower()]
            if coworkers:
                present_shifts.append(f"Shift {shift_id} (with {', '.join(coworkers)})")
            else:
                present_shifts.append(f"Shift {shift_id}")

    if not present_shifts:
        return f"Day {day_index}: Off"
    else:
        return f"Day {day_index}: " + "; ".join(present_shifts)

def build_person_schedule_summary(schedule_list: List[Any], person: str) -> str:
    """
    Builds a compact 3-day text summary for the given person.
    Example output:
      Lavanya:
      D0: S0
      D1: S0,S1
      D2: HOLIDAY
    """
    # Sort by day
    try:
        sorted_days = sorted(schedule_list, key=lambda d: d.get("day", 0))
    except Exception:
        sorted_days = schedule_list

    # Only take first 3 days
    # sorted_days = sorted_days[:3]

    lines = [f"{person}:"]
    for day_obj in sorted_days:
        day_index = day_obj.get("day", "?") if isinstance(day_obj, dict) else "?"
        sched = day_obj.get("schedule")

        if isinstance(sched, str) and sched.upper() == "HOLIDAY":
            lines.append(f"DAY {day_index}: HOLIDAY")
            continue

        if not isinstance(sched, list):
            lines.append(f"DAY {day_index}: ERR")
            continue

        shifts = []
        for shift_obj in sched:
            workers = shift_obj.get("workers") or []
            if person.strip().lower() in [w.strip().lower() for w in workers if isinstance(w, str)]:
                shifts.append(f"S{shift_obj.get('shift')}")
        if shifts:
            lines.append(f"D{day_index}: {','.join(shifts)}")
        else:
            lines.append(f"D{day_index}: OFF")

    return "\n".join(lines)


@app.post("/api/track-and-send-schedule")
async def track_and_send_schedule(req: TrackScheduleRequest = Body(...)):
    """
    Accepts the full schedule array, the person to track, and a phone number.
    Returns the computed per-day schedule for the person and attempts to send it via Twilio.
    Enforces the same consent + rate limit checks as your simulate-sms endpoint.
    """
    to_phone = req.to_phone.strip()
    person = req.person_name.strip()

    # Basic phone format validation (E.164-like)
    if not to_phone.startswith("+"):
        raise HTTPException(
            status_code=400,
            detail="Phone number must be in E.164 format starting with + and country code."
        )

    if not req.consent:
        raise HTTPException(
            status_code=403,
            detail="Recipient not authorized. Set consent=true for prototype."
        )

    if not _rate_limit_allow(to_phone):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {to_phone}. Max {RATE_LIMIT_MAX_PER_HOUR} per hour.",
        )

    # Build the person's schedule summary string
    try:
        summary_text = build_person_schedule_summary(req.schedule, person)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid schedule format: {e}")

    # Prepare SMS message (append simulation marker if not present)
    message = summary_text
    if SIMULATION_MARKER not in message:
        message = message + "\n" + SIMULATION_MARKER

    # Send via Twilio
    send_result = send_sms_via_twilio(to_phone, message)

    record = {
        "to": to_phone,
        "person_tracked": person,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": send_result.get("status"),
        "twilio_sid": send_result.get("sid"),
        "note": req.note or "",
    }

    # Return both the structured schedule we computed and the send result
    return JSONResponse(
        status_code=200 if send_result.get("status") == "sent" else 500,
        content={
            "computed_schedule": {
                "person": person,
                "text_summary": summary_text,
            },
            "send_result": send_result,
            "record": record,
        },
    )

  
  
  
if __name__ == "__main__":
  import uvicorn
  logger.info(f"Server starting on port {PORT}")
  uvicorn.run(app, host="0.0.0.0", port=PORT)
