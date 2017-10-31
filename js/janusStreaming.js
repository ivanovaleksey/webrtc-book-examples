var remoteStream, peerConnection;

var remoteVideo = document.getElementById("remoteVideo");

var connectButton = document.getElementById("connectButton");
var attachButton = document.getElementById("attachButton");

attachButton.disabled = true;

attachButton.onclick = attachToStream;
connectButton.onclick = connectToStream;

var sessionId, pluginHandleId;
var janusHost = 'https://192.168.99.100:8089/janus'; // $(docker-machine ip default)

function connectToStream() {
    connectButton.disabled = true;

    peerConnection = new RTCPeerConnection(null);

    // Triggered whenever a new candidate is made available to the local peer by the ICE protocol machine
    peerConnection.onicecandidate = gotLocalIceCandidate;

    // Triggered on setRemoteDescription() call
    peerConnection.onaddstream = gotRemoteStream;

    var payload = {
      "janus": "create",
      "transaction": getTransactionId()
    };
    fetch(janusHost, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(function (resp) {
      return resp.json();
    }).then(function (data) {
      console.log(data);
      sessionId = data.data.id;

      handleEvents();

      var payload = {
        "janus": "attach",
        "plugin": "janus.plugin.streaming",
        "transaction": getTransactionId()
      };
      fetch(janusHost + '/' + sessionId, {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(function (resp) {
        return resp.json();
      }).then(function (data) {
        console.log(data);
        pluginHandleId = data.data.id;

        attachButton.disabled = false;
      });
    });
}

function attachToStream() {
    attachButton.disabled = true;

    var payload = {
      "janus": "message",
      "transaction": getTransactionId(),
      "body": {
        "request": "watch",
        "id": 1, // Hardcoded value for third-party tool streaming
      }
    };
    fetch(janusHost + '/' + sessionId + '/' + pluginHandleId, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(function (resp) {
      return resp.json();
    }).then(function (data) {
      console.log("Attached to stream");
      console.log(data);
    });
}

function handleEvents() {
    fetch(
      janusHost + '/' + sessionId
    ).then(function (resp) {
      return resp.json();
    }).then(function (event) {
      console.log('Event received');
      console.log(event);

      handleEvent(event);
      handleEvents();
    });
}

function handleEvent(data) {
    if (data.janus == 'event' && data.jsep) {
      var jsep = new RTCSessionDescription(data.jsep);
      console.log(jsep);

      if (jsep.type == 'offer') {
        peerConnection.setRemoteDescription(jsep).then(function () {
          peerConnection.createAnswer(gotLocalDescription, onSignalingError);
        });
      }
    }
}

function gotLocalIceCandidate(event) {
    console.log('gotLocalIceCandidate');
    var candidate = event.candidate;
    console.log(candidate);

    if (candidate) {
      var payload = {
        "janus": "trickle",
        "transaction": getTransactionId(),
        "candidate": candidate
      };
      fetch(janusHost + '/' + sessionId + '/' + pluginHandleId, {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(function (resp) {
        return resp.json();
      }).then(function (data) {
        console.log('Done uploading ICE candidate');
        console.log(data);
      });
    }
}

function gotRemoteStream(event) {
    console.log('gotRemoteStream');

    remoteStream = event.stream;
    remoteVideo.src = window.URL.createObjectURL(remoteStream);
}

function gotLocalDescription(desc) {
    console.log('got local SDP');
    console.log(desc);

    peerConnection.setLocalDescription(desc);

    var payload = {
      "janus": "message",
      "transaction": getTransactionId(),
      "body": {
        "request": "start"
      },
      "jsep": {
        "type": "answer",
        "sdp": desc.sdp
      }
    };

    console.log('Start uploading answer');
    fetch(janusHost + '/' + sessionId + '/' + pluginHandleId, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(function (resp) {
      return resp.json();
    }).then(function (data) {
      console.log('Done uploading answer');
      console.log(data);
    });
}

function onSignalingError(error){
  console.log('Failed to create signaling message : ' + error.message);
}

function getTransactionId() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
}
