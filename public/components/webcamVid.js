class WebcamVid extends HTMLElement {
	constructor() {
		super();

		this.innerHTML = `<div class="video-container">
      <video id="webcam"></video>
    </div>`;
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		this.render();
	}

	disconnectedCallback() {
		console.log("disconnected", this);
	}
}

if ("customElements" in window) {
	customElements.define("webcam-vid", WebcamVid);
}

window.onload = function () {
	let All_mediaDevices = navigator.mediaDevices;
	if (!All_mediaDevices || !All_mediaDevices.getUserMedia) {
		console.log("getUserMedia() not supported.");
		return;
	}
	All_mediaDevices.getUserMedia({
		audio: true,
		video: true,
	})
		.then(function (vidStream) {
			var video = document.getElementById("webcam");
			if ("srcObject" in video) {
				video.srcObject = vidStream;
			} else {
				video.src = window.URL.createObjectURL(vidStream);
			}
			video.onloadedmetadata = function (e) {
				video.play();
			};
		})
		.catch(function (e) {
			console.log(e.name + ": " + e.message);
		});
};
