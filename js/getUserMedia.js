var constraints = {
  video: {
    mandatory: {
      maxWidth: 320,
      maxHeight: 240
    }
  }
};

function successCallback(gotStream) {
  window.stream = gotStream;
  videoElem.src = window.URL.createObjectURL(gotStream);
  videoElem.play();
}

function errorCallback(error) {}

videoElem = document.querySelector('video');

navigator.getUserMedia(constraints, successCallback, errorCallback);
