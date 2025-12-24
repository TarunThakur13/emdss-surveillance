#!/usr/bin/env python3

"""
Emergency Motion Detection Surveillance System
----------------------------------------------
A Flask-based web application that streams live video
from a camera and performs real-time motion detection
using OpenCV.

Features:
- Live video streaming
- Motion detection with bounding boxes
- Web-based monitoring dashboard
- Snapshot capture
"""


from imutils.video import VideoStream
from flask import Response, Flask, render_template, jsonify
from singlemotiondetector import SingleMotionDetector

import threading
import datetime
import imutils
import time
import cv2

# ================= GLOBALS =================
vs = None
outputFrame = None
lock = threading.Lock()
frame_idx = 0

motion_enabled = True   # Motion ON/OFF toggle

# Initialize motion detector
md = SingleMotionDetector(accumWeight=0.1)
bs_frame_count = 32

# ================= FLASK APP =================
app = Flask(__name__)

# ================= VIDEO STREAM INIT =================
vs = VideoStream(src=0).start()
time.sleep(2.0)

# ================= ROUTES =================
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


@app.route("/snapshot")
def snapshot():
    global outputFrame, lock

    with lock:
        if outputFrame is None:
            return "No frame available", 400

        filename = datetime.datetime.now().strftime(
            "snapshot_%Y%m%d_%H%M%S.jpg"
        )
        cv2.imwrite(filename, outputFrame)

    return f"Snapshot saved as {filename}"


# ================= MOTION DETECTION =================
def detect_motion(frame):
    global outputFrame, frame_idx, md

    frame = imutils.resize(frame, width=400)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (7, 7), 0)

    timestamp = datetime.datetime.now()
    cv2.putText(
        frame,
        timestamp.strftime("%A %d %B %Y %I:%M:%S %p"),
        (10, frame.shape[0] - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.35,
        (0, 0, 255),
        1,
    )

    if motion_enabled and frame_idx > bs_frame_count:
        motion = md.detect(gray)
        if motion is not None:
            (_, (minX, minY, maxX, maxY)) = motion
            cv2.rectangle(
                frame,
                (minX, minY),
                (maxX, maxY),
                (0, 0, 255),
                2,
            )

    md.update(gray)
    frame_idx += 1

    with lock:
        outputFrame = frame.copy()


# ================= STREAM GENERATOR =================
def generate():
    global outputFrame

    while True:
        frame = vs.read()
        detect_motion(frame)

        with lock:
            if outputFrame is None:
                continue

            (flag, encodedImage) = cv2.imencode(".jpg", outputFrame)
            if not flag:
                continue

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + bytearray(encodedImage)
            + b"\r\n"
        )


@app.route("/video_feed")
def video_feed():
    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


# ================= MAIN =================
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True,
        threaded=True,
        use_reloader=False,
    )

