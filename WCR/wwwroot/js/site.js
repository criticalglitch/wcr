// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

import { signalR } from "../lib/microsoft/signalr/dist/browser/signalr";

// Write your JavaScript code.
async function GetVideo() {
	if (!navigator.mediaDevices.getUserMedia) {
		return;
	}
		var video = document.querySelector("#Presentation");
	try {
		var webCamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			video.srcObject = webcamStream;
		}
	catch (err) {
		console.log(err);
		}
	}

async function InitializePresenter() {
	window.WCR = {};
	var wcr = window.WCR;
	wcr.connection = new signalR.HubConnectionBuilder().withUrl("/PresentationHub").build(); // create connection
	try {
		await wcr.connection.start();
		InitSignalR();
		await wcr.connection.invoke("CreateRoom");
		InitWebRTC();
}
	catch (err) {
		console.error(err.toString());
	}
}

function InitializePresenter() {
	window.WCR = {};
	var wcr = window.WCR;
	wcr.connection = new signalR.HubConnectionBuilder().withUrl("/PresentationHub").build(); // create connection
	wcr.connection.start().then(InitSignalR).then(function() {
		wcr.connection.invoke("CreateRoom").catch(function(err) {
			return console.error(err.toString());
		});
	});

}

function InitSignalR() {
	var wcr = window.WCR
	wcr.connection.on("created", function(presentationId) {
		wcr.presentationId = presentationId;
		console.log("room created");
	});
	wcr.connection.on("joined", function(presentationId) {
		wcr.presentationId = presentationId;
		console.log("room joined");
	});
	wcr.connection.on("ready", function() {
		console.log("todo connect to video stream");
	});
	wcr.connection.on("bye", function() {
		console.log("someone left the room");
	});
	window.addEventListener("unload", function() {
		if (wcr.presentationId !== undefined) {
			wcr.connection.invoke("LeaveRoom", wcr.presentationId).catch(function(err) {
				console.error(err.toString());
			})
		}
	}); 
}

function InitWebRTC() {
	const config = {
		"iceServers": [{"urls": "stun:stun.1.google.com:19302"}]
	};
	var wcr = window.WCR;
	wcr.videoConnection = new RTCPeerConnection(config)
}