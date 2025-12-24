const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
let motion_enabled = true; // Track local state

// 1. Start the camera stream
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((err) => {
            console.error("Camera error: ", err);
            alert("Please allow camera access to use the dashboard.");
        });
}

function updateTime() {
    const now = new Date().toLocaleTimeString();
    document.getElementById("time1").innerText = now;
    document.getElementById("time2").innerText = now;
}
setInterval(updateTime, 1000);

// 2. Automated Motion Detection Loop
// Sends a frame to the server every 500ms (2 times per second)
setInterval(() => {
    if (motion_enabled) {
        processFrame();
    }
}, 500);

function toggleMotion() {
    fetch("/toggle_motion", { method: "POST" })
        .then(res => res.json())
        .then(data => {
            motion_enabled = data.status === "ON";
            document.getElementById("motionStatus").innerText = "Motion: " + data.status;
        });
}

// 3. New Function: Sends frames for background analysis
function processFrame() {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    fetch("/snapshot", {
        method: "POST",
        body: JSON.stringify({ image: imageData }),
        headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(data => {
        // Update UI based on motion detection result from app.py
        const alertBadge = document.querySelector(".camera-card .badge");
        if (data.motion) {
            alertBadge.innerText = "Motion Detected";
            alertBadge.className = "badge danger";
            document.querySelector(".camera-card").classList.add("alert");
        } else {
            alertBadge.innerText = "Monitoring";
            alertBadge.className = "badge safe";
            document.querySelector(".camera-card").classList.remove("alert");
        }
    })
    .catch(err => console.error("Processing error:", err));
}

// Keep the manual snapshot button functional
function takeSnapshot() {
    processFrame();
    alert("Manual snapshot request sent!");
}
