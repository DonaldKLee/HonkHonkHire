import * as facemesh from "@mediapipe/face_mesh";

// Get video and canvas elements
const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("overlay");
const canvasCtx = canvasElement.getContext("2d");

// Initialize MediaPipe Face Mesh model
const faceMesh = new mediapipe.FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
faceMesh.setOptions({
    selfieMode: true, // Set to true for front camera
    maxNumFaces: 1,   // Maximum number of faces to detect
});

// Start video stream
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        videoElement.srcObject = stream;
    })
    .catch((error) => {
        console.error("Error accessing camera:", error);
    });

// Initialize Face Mesh tracking
faceMesh.onResults(handleFaceMesh);

// Function to handle face mesh results
function handleFaceMesh(results) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    drawConnectors(canvasCtx, results.multiFaceLandmarks, FACEMESH_TESSELATION, { color: '#00FF00', lineWidth: 1 });
}

// Start face mesh detection
faceMesh.start();

// Show the face mesh for 5 seconds
setTimeout(() => {
    faceMesh.close(); // Stop face mesh detection
}, 5000);