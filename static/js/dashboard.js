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

let prevFrame = null;

function processFrame() {
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (prevFrame) {
        let diff = 0;
        for (let i = 0; i < current.data.length; i += 4) {
            diff += Math.abs(current.data[i] - prevFrame.data[i]);
        }

        if (diff > 1_000_000) {
            showMotion(true);
        } else {
            showMotion(false);
        }
    }

    prevFrame = current;
}

function showMotion(isMotion) {
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


// Keep the manual snapshot button functional
function takeSnapshot() {
    processFrame();
    alert("Manual snapshot request sent!");
}
