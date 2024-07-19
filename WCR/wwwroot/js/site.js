// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.
// Write your JavaScript code.

function InitializePresenter() {
	window.WCR = {
		presentationId: crypto.randomUUID(),
		connection: new signalR.HubConnectionBuilder().withUrl("/PresentationHub").build(), // create connection
		videoConnection: new RTCMultiConnection()
	};
	var wcr = window.WCR;
	try {
		wcr.videoConnection.sdpConstraints.mandatory = {
			OfferToReceiveAudio: false,
			OfferToReceiveVideo: false
		};
		InitWebRTC(true);
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
		videoConnection: new RTCMultiConnection(),
		captureCanvas: document.createElement("canvas")
	};
	var wcr = window.WCR;
	try {
		wcr.videoConnection.sdpConstraints.mandatory = {
			OfferToReceiveAudio: true,
			OfferToReceiveVideo: true
		};
		InitWebRTC(false);

		wcr.videoConnection.join(wcr.presentationId, function (isJoined, roomid, error) {
			console.log(isJoined);
			console.log(roomid);
			console.log(error);
			InitViewerUI();
		});
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
	button.addEventListener("click", function () {
		wcr.captureCanvas.toBlob(async function (body) {
			var response = await fetch(`${window.location.origin}/api/v1/transcribe`, {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/octet-stream"
				}), body
			});
		}, "image/png");
	});
	container.appendChild(button);
	var drawingContext = wcr.captureCanvas.getContext("2d");
	var video = document.getElementById(wcr.streamid);
	function cloneVideoToCanvas() {
		drawingContext.canvas.width = video.videoWidth;
		drawingContext.canvas.height = video.videoHeight;
		drawingContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
		requestAnimationFrame(cloneVideoToCanvas);
	}
	video.addEventListener("loadeddata", cloneVideoToCanvas);
}

function InitWebRTC(isPresenter) {
	var wcr = window.WCR;
	wcr.videoConnection.channel = "wcr";
	wcr.videoConnection.setCustomSocketHandler(SignalRConnectionWithHub(wcr.connection));
	wcr.videoConnection.session = {
		audio: true,
		video: true,
		oneway: true
	};
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
	};

	if (wcr.videoConnection.DetectRTC.browser.name === 'Firefox') {
		wcr.videoConnection.mediaConstraints.width = 1280;
		wcr.videoConnection.mediaConstraints.height = 720;
	}

	wcr.videoConnection.iceServers = [
		{
			"urls": [
				'stun:stun.l.google.com:19302',
				'stun:stun1.l.google.com:19302',
				'stun:stun2.l.google.com:19302',
				'stun:stun.l.google.com:19302?transport=udp',
			]
		}
	];
	wcr.videoConnection.videosContainer = document.getElementById("presentation-container");

	wcr.videoConnection.enableScalableBroadcast = true;
	wcr.videoConnection.dontAttachLocalStream = !isPresenter;
	wcr.videoConnection.dontGetRemoteStream = isPresenter;

	wcr.videoConnection.onstream = function (event) {
		var existing = document.getElementById(event.streamid);
		if (existing && existing.parentNode) {
			existing.parentNode.removeChild(existing);
		}
		event.mediaElement.removeAttribute("src");
		event.mediaElement.removeAttribute("srcObject");
		event.mediaElement.muted = true;
		event.mediaElement.volume = 0;

		var connection = wcr.videoConnection;
		var presentation = document.createElement("video");
		presentation.setAttribute("autoplay", true);
		presentation.setAttribute("playsinline", true);
		if (event.type === "local") {
			presentation.volume = 0;
			presentation.muted = true;
		}
		presentation.srcObject = event.stream;
		presentation.id = event.streamid;
		var width = parseInt(connection.videosContainer.clientWidth / 3) - 25;
		presentation.style.width = width;
		connection.videosContainer.appendChild(presentation);
		wcr.streamid = event.streamid;
		setTimeout(presentation.media.play, 5000);
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