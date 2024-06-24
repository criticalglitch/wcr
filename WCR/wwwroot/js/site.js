// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
function GetVideo()
{
	if (navigator.mediaDevices.getUserMedia) {
		var video = document.querySelector("#Presentation");
		function handleVideo(webcamStream) {
			video.srcObject = webcamStream;
		}
		function handleError(error) {
			console.log(error);
		}
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(handleVideo).catch(handleError);
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