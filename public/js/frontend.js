const transcriptionDiv = document.getElementById("transcription");
const audioContext = new AudioContext();

// Create a function to set up the AudioWorkletNode
async function setupAudioWorklet() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

		const workletNode = audioContext.createMediaStreamSource(stream);

		await audioContext.audioWorklet.addModule("worklet-processor.js"); // Load the worklet processor

		const scriptNode = new AudioWorkletNode(audioContext, "worklet-processor");
		const socket = new WebSocket("ws://localhost:3000"); // Replace with your server URL

		scriptNode.port.onmessage = (event) => {
			const audioStream = event.data;
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(audioStream);
			}
		};

		workletNode.connect(scriptNode);
		scriptNode.connect(audioContext.destination);
	} catch (error) {
		console.error("Error accessing microphone:", error);
	}
}

// Call the setup function
setupAudioWorklet();
