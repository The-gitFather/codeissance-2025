from flask import Flask, request, jsonify
from flask_cors import CORS
from scheduler import schedule
import logging

app = Flask(__name__)
CORS(app, origins="*")

# Configure logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")


@app.route("/schedule", methods=["POST"])
def schedule_api():
    try:
        data = request.get_json()

        employees = data["employees"]
        days = data["days"]
        shifts = data["shifts"]
        availability = {tuple(item) for item in data["availability"]}
        max_shifts = data["max_shifts"]
        coverage = data["coverage"]
        holidays = set(data.get("holidays", [])) if data.get("holidays") else None

        result = schedule(employees, days, shifts, availability, max_shifts, coverage, holidays)

        if result is None:
            return jsonify({"status": "error", "message": "No feasible schedule found"}), 400

        return jsonify({"status": "success", "schedule": result})

    except Exception as e:
        logging.exception("Error while scheduling")
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
