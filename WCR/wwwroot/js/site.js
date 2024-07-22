	// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.e
// Write your JavaScript code.

var connection = new RTCMultiConnection();
connection.socketURL = "https://muazkhan.com:9001/";

function InitializePresenter() {
	window.WCR = {
		presentationId: "",
		connection: new signalR.HubConnectionBuilder().withUrl("/PresentationHub").build(), // create connection
		videoConnection: connection
	};
	var wcr = window.WCR;
	try {
		InitWebRTC(true);
		wcr.presentationId = wcr.videoConnection.token();
		wcr.videoConnection.open(wcr.presentationId, function () {
			var container = document.getElementById("share-container");
			var button = document.createElement("button");
			button.textContent = "🔗 Share Presentation";
			button.id = "share";
			button.addEventListener("click", function () {
				var presentationUrl = `${window.location.origin}/viewer?presentationId=${wcr.presentationId}`;
				navigator.clipboard.writeText(presentationUrl);
				show_notification("Copied!");
			});
			container.appendChild(button);
		});
	}
	catch (err) {
		console.error(err.toString());
	}
}

function InitializeViewer() {
	const urlParams = new URLSearchParams(window.location.search);
	window.WCR = {
		presentationId: urlParams.get("presentationId"),
		connection: new signalR.HubConnectionBuilder().withUrl("/PresentationHub").build(), // create connection
		videoConnection: connection,
		captureCanvas: document.createElement("canvas")
	};
	var wcr = window.WCR;
	try {
		InitWebRTC(false);

		wcr.videoConnection.join(wcr.presentationId);
		InitViewerUI();
	}
	catch (err) {
		console.error(err.toString());
	}
}

function InitViewerUI() {
	var wcr = window.WCR;
	var main = document.querySelector("main");
	main.parentElement.classList.add("container-fill");
	var container = document.getElementById("share-container");
	var button = document.createElement("button");
	button.textContent = "Request Transcription";
	button.addEventListener("click", CallCaptureTranscription);
	container.appendChild(button);
	var drawingContext = wcr.captureCanvas.getContext("2d");
	function cloneVideoToCanvas() {
		var video = document.getElementById(wcr.streamid);
		if (!!video) {
			drawingContext.canvas.width = video.videoWidth;
			drawingContext.canvas.height = video.videoHeight;
			drawingContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
		}
		requestAnimationFrame(cloneVideoToCanvas);
	}
	cloneVideoToCanvas();
}
function BuildLabelFromString(text) {
	var label = document.createElement("label");
	label.textContent = text;
	return label;
}

function AddSeparatorToDocument() {
	var textContainer = document.getElementById("transcription-list-container");
	textContainer.removeChild(textContainer.lastChild);
	textContainer.appendChild(document.createElement("hr"));
}

function AddLabelToDocument(label) {
	var textContainer = document.getElementById("transcription-list-container");
	textContainer.appendChild(label);
	textContainer.appendChild(document.createElement("br"));
}

function CallCaptureTranscription() {
	var captureCanvas = window.WCR.captureCanvas;
	captureCanvas.toBlob(async function (body) {
		var response = await fetch(`${window.location.origin}/api/v1/transcribe`, {
			method: "POST",
			headers: new Headers({
				"Content-Type": "application/octet-stream"
			}), body
		});
		var lines = await response.json();
		if (lines.length === 0) {
			return; // early return
		}
		for (var line of lines) {
			var text = BuildLabelFromString(line.text);
			AddLabelToDocument(text);
		}
		AddSeparatorToDocument();
	}, "image/png");
}
function InitWebRTC(isPresenter) {
	var wcr = window.WCR;
	wcr.videoConnection.session = {
		audio: true,
		video: true
	};
	if (!isPresenter) {
		wcr.videoConnection.session.oneway = true;
	}
	wcr.videoConnection.mediaConstraints = {
		audio: true,
		video: {
			mandatory: {
				minWidth: 1280,
				maxWidth: 1280,
				minHeight: 720,
				maxHeight: 720
			},
			optional: []
		}
	}

	if (wcr.videoConnection.DetectRTC.browser.name === 'Firefox') {
		wcr.videoConnection.mediaConstraints.video.width = 1280;
		wcr.videoConnection.mediaConstraints.video.height = 720;
		delete wcr.videoConnection.mediaConstraints.video.mandatory;
		delete wcr.videoConnection.mediaConstraints.video.optional;
	}

	wcr.videoConnection.videosContainer = document.getElementById("presentation-container");

	wcr.videoConnection.dontAttachLocalStream = !isPresenter;
	wcr.videoConnection.onstream = function (event) {
		wcr.streamid = event.streamid;
		var existing = document.getElementById(event.streamid);
		if (existing && existing.parentNode) {
			existing.parentNode.removeChild(existing);
		}
		event.mediaElement.removeAttribute("src");
		event.mediaElement.removeAttribute("srcObject");
		event.mediaElement.muted = true;
		event.mediaElement.volume = 0;
		var presentation = document.createElement("video");
		presentation.id = event.streamid;
		presentation.setAttributeNode(document.createAttribute("autoplay"));
		presentation.setAttributeNode(document.createAttribute("muted"));
		presentation.setAttributeNode(document.createAttribute("playsinline"));
		presentation.setAttributeNode(document.createAttribute("loop"));
		presentation.setAttributeNode(document.createAttribute("controls"));
		if (event.type === "local") {
			presentation.volume = 0;
		}
		presentation.srcObject = event.stream;
		wcr.videoConnection.videosContainer.appendChild(presentation);
		setTimeout(presentation.play.bind(presentation), 5000);
	};
}

function show_notification(msg) {
	const notification = document.getElementById("notification");
	notification.innerText = msg;
	notification.classList.add("show");
	setTimeout(function () {
		notification.classList.remove("show");
	}, 5000);
}