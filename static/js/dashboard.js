// ======================
// DOM ELEMENTS
// ======================
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let motionEnabled = true;
let prevFrame = null;
const MOTION_THRESHOLD = 900000; // sensitivity (adjustable)

// ======================
// START CAMERA
// ======================
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Camera error:", err);
            alert("Camera access is required for motion detection.");
        });
} else {
    alert("Camera not supported in this browser.");
}

// ======================
// LIVE CLOCK
// ======================
function updateTime() {
    const now = new Date().toLocaleTimeString();
    document.getElementById("time1").innerText = now;
    document.getElementById("time2").innerText = now;
}
setInterval(updateTime, 1000);

// ======================
// MOTION LOOP (CLIENT SIDE)
// ======================
setInterval(() => {
    if (motionEnabled && video.readyState === 4) {
        detectMotion();
    }
}, 500);

// ======================
// MOTION DETECTION LOGIC
// ======================
function detectMotion() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (!prevFrame) {
        prevFrame = frame;
        return;
    }

    let diff = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
        diff += Math.abs(frame.data[i] - prevFrame.data[i]);
    }

    updateUI(diff > MOTION_THRESHOLD);
    prevFrame = frame;
}

// ======================
// UI UPDATE
// ======================
function updateUI(isMotion) {
    const badge = document.querySelector(".camera-card .badge");
    const card = document.querySelector(".camera-card");

    if (isMotion) {
        badge.innerText = "Motion Detected";
        badge.className = "badge danger";
        card.classList.add("alert");
    } else {
        badge.innerText = "Monitoring";
        badge.className = "badge safe";
        card.classList.remove("alert");
    }
}

// ======================
// TOGGLE MOTION
// ======================
function toggleMotion() {
    motionEnabled = !motionEnabled;
    document.getElementById("motionStatus").innerText =
        "Motion: " + (motionEnabled ? "ON" : "OFF");
}

// ======================
// MANUAL SNAPSHOT
// ======================
function takeSnapshot() {
    detectMotion();
    alert("Snapshot captured locally!");
}
