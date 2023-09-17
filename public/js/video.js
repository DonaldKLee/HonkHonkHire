import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3"
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision
const videoBlendShapes = document.getElementById("video-blend-shapes")

//notyf
let notyf = new Notyf({
    duration: 2500,
    position: { x: "center", y: "top" },
    types: [
        {
            type: "custom",
            background: "#805AD5",
            icon: false
        }
    ]
});

let faceLandmarker
let runningMode = "VIDEO"
let webcamRunning = true
const videoWidth = 950

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  )
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  })
}
createFaceLandmarker()

const video = document.getElementById("webcam")
const canvasElement = document.getElementById("output_canvas")

const canvasCtx = canvasElement.getContext("2d")

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
//   enableWebcamButton = document.getElementById("webcamButton")
//   enableWebcamButton.addEventListener("click", enableCam)
    setTimeout(() => {
        enableCam()
    }, 500);
} else {
  console.warn("getUserMedia() is not supported by your browser")
}


// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.")
    return
  }

  console.log("hi")

  // getUsermedia parameters.
  const constraints = {
    video: true
  }

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    video.srcObject = stream
    video.addEventListener("loadeddata", predictWebcam)
    setTimeout(() => {
        notyf.open({
            type: 'custom',
            message: `<b>Face detected!</b>` 
        });
    }, 2000);
  })
}

let lastVideoTime = -1
let results = undefined
const drawingUtils = new DrawingUtils(canvasCtx)
async function predictWebcam() {
  const radio = video.videoHeight / video.videoWidth
  video.style.width = videoWidth + "px"
  video.style.height = videoWidth * radio + "px"
  canvasElement.style.width = videoWidth + "px"
  canvasElement.style.height = videoWidth * radio + "px"
  canvasElement.width = video.videoWidth
  canvasElement.height = video.videoHeight
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO"
    await faceLandmarker.setOptions({ runningMode: runningMode })
  }
  let startTimeMs = performance.now()
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = faceLandmarker.detectForVideo(video, startTimeMs)
  }
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      )
    }
    setTimeout(() => {
        document.getElementById('output_canvas').style.transitionDuration = "1s";
        document.getElementById('output_canvas').style.opacity = 0;
    },1000);
  }
  drawBlendShapes(videoBlendShapes, results.faceBlendshapes)
 

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam)
  }
}

function drawBlendShapes(el, blendShapes) {
  if (!blendShapes.length) {
    return
  }

//   let htmlMaker = ""
//   blendShapes[0].categories.map(shape => {
//     htmlMaker += `
//       <li class="blend-shapes-item">
//         <span class="blend-shapes-label">${shape.displayName ||
//           shape.categoryName}</span>
//         <span class="blend-shapes-value" style="width: calc(${+shape.score *
//           100}% - 120px)">${(+shape.score).toFixed(4)}</span>
//       </li>
//     `
//   })

  console.log(blendShapes[0].categories)

  if(blendShapes[0].categories[44].score > 0.7 || blendShapes[0].categories[45].score > 0.7) {
    notyf.open({
        type: 'custom',
        message: `<b>Keep smiling! You're doing great!</b>` 
    });
    document.querySelectorAll('.notyf__toast').slice(1).forEach((el) => {
        el.style.display = "none";
    });
  }

//   el.innerHTML = htmlMaker
}