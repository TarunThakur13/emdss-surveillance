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
    fetch("/snapshot")
        .then(res => res.text())
        .then(msg => alert(msg));
}
