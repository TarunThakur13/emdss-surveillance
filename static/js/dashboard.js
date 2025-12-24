const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');

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

function toggleMotion() {
    fetch("/toggle_motion", { method: "POST" })
        .then(res => res.json())
        .then(data => {
            document.getElementById("motionStatus").innerText =
                "Motion: " + data.status;
        });
}

function takeSnapshot() {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert current frame to base64
    const imageData = canvas.toDataURL('image/jpeg');

    fetch("/snapshot", {
        method: "POST",
        body: JSON.stringify({ image: imageData }),
        headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(data => alert(data.message || "Snapshot captured!"));
}
