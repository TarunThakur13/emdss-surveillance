import os
import cv2
import numpy as np
import base64
import datetime
import imutils
from flask import Flask, render_template, request, jsonify
from singlemotiondetector import SingleMotionDetector

app = Flask(__name__)

# Initialize motion detector and globals
# On Vercel, globals might reset between requests, so we initialize carefully
md = SingleMotionDetector(accumWeight=0.1)
motion_enabled = True
bs_frame_count = 32
frame_idx = 0

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/toggle_motion", methods=["POST"])
def toggle_motion():
    global motion_enabled
    motion_enabled = not motion_enabled
    return jsonify({"status": "ON" if motion_enabled else "OFF"})

@app.route("/snapshot", methods=["POST"])
def process_frame():
    global frame_idx, md
    
    try:
        # 1. Get image from the browser camera
        data = request.get_json()
        image_data = data.get('image')
        if not image_data:
            return jsonify({"error": "No image"}), 400

        # 2. Decode the Base64 image
        header, encoded = image_data.split(",", 1)
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 3. Apply your motion detection logic
        frame = imutils.resize(frame, width=400)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (7, 7), 0)

        motion_detected = False
        if motion_enabled:
            motion = md.detect(gray)
            if motion is not None:
                motion_detected = True
                # (You can add drawing logic here if sending the frame back)

        md.update(gray)
        frame_idx += 1

        return jsonify({
            "message": "Frame processed",
            "motion": motion_detected,
            "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
