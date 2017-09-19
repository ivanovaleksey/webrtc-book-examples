// JavaScript variables holding stream and connection information
var localStream, remoteStream, localPeerConnection, remotePeerConnection;

// JavaScript variables associated with HTML5 video elements in the page
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// JavaScript variables assciated with call management buttons in the page
var startButton = document.getElementById("startButton");
var callButton = document.getElementById("callButton");
var hangupButton = document.getElementById("hangupButton");

// Just allow the user to click on the Call button at start-up
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

// Associate JavaScript handlers with click events on the buttons
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

function start() {
  navigator.getUserMedia({ video: true }, successCallback, errorCallback);
  startButton.disabled = true;
  callButton.disabled = false;
}

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  localPeerConnection = new RTCPeerConnection(null);
  remotePeerConnection = new RTCPeerConnection(null);

  // Triggered whenever a new candidate is made available to the local peer by the ICE protocol machine
  localPeerConnection.onicecandidate = gotLocalIceCandidate;
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;

  // Triggered on setRemoteDescription() call
  remotePeerConnection.onaddstream = gotRemoteStream;

  localPeerConnection.addStream(localStream);
  console.log('creating offer');
  localPeerConnection.createOffer(gotLocalDescription, onSignalingError);
}

function hangup() {
  localPeerConnection.close();
  remotePeerConnection.close();

  localStream = null;
  remoteStream = null;

  startButton.disabled = false;
  hangupButton.disabled = true;
}

function gotLocalIceCandidate(event) {
  console.log('gotLocalIceCandidate');
  var candidate = event.candidate;
  console.log(candidate);

  if (candidate) {
    // Provides a remote candidate to the ICE Agent
    remotePeerConnection.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  }
}

function gotRemoteIceCandidate(event) {
  console.log('gotRemoteIceCandidate');
  var candidate = event.candidate;
  console.log(candidate);

  if (candidate) {
    localPeerConnection.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  }
}

function gotRemoteStream(event) {
  console.log('gotRemoteStream');

  remoteStream = event.stream;
  remoteVideo.src = window.URL.createObjectURL(remoteStream);
}

function gotLocalDescription(desc) {
  console.log('got local SDP');

  localPeerConnection.setLocalDescription(desc);
  remotePeerConnection.setRemoteDescription(desc);

  console.log('creating answer');
  remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
}

function gotRemoteDescription(desc) {
  console.log('got remote SDP');

  remotePeerConnection.setLocalDescription(desc);
  localPeerConnection.setRemoteDescription(desc);
}

function onSignalingError(error){
  console.log('Failed to create signaling message : ' + error.name);
}

function successCallback(gotStream) {
  localStream = gotStream;
  localVideo.src = window.URL.createObjectURL(localStream);
}

function errorCallback(error) {
  console.log('error' + error);
}
