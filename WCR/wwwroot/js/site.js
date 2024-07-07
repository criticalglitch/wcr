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
		InitWebRTC();
		wcr.videoConnection.open(wcr.presentationId, function () {
			// TODO: display shareable presentation URL
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
		videoConnection: new RTCMultiConnection()
	};
	var wcr = window.WCR;
	try {
		wcr.videoConnection.sdpConstraints.mandatory = {
			OfferToReceiveAudio: true,
			OfferToReceiveVideo: true
		};
		InitWebRTC();
		wcr.videoConnection.openOrJoin(wcr.presentationId, undefined);
	}
	catch (err) {
		console.error(err.toString());
	}
}

function InitWebRTC() {
	var wcr = window.WCR;
	wcr.videoConnection.channel = wcr.presentationId;
	wcr.videoConnection.setCustomSocketHandler(SignalRConnectionWithHub(wcr.connection));
	wcr.videoConnection.session = { audio: true, video: true, oneway: true };
	wcr.videoConnection.iceServers = [
		{
			"urls": [ "stun:stun.1.google.com:19302" ]
		}
	];
	wcr.videoConnection.videosContainer = document.getElementById("presentation-container");
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
		setTimeout(presentation.media.play, 5000);
	};
}