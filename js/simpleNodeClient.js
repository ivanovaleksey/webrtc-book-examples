div = document.querySelector('div');

var socket = io.connect('http://localhost:8181');

channel = prompt("Enter signaling channel name:");
if (channel !== "") {
  console.log('Trying to create or join channel: ', channel);
  socket.emit('create or join', channel);
}

socket.on('created', function (channel) {
  console.log('channel ' + channel + ' has been created!');
  console.log('This peer is the initiator...');

  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Channel ' + channel + ' has been created!'));
  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> This peer is the initiator...'));
});

socket.on('full', function (channel) {
  console.log('channel ' + channel + ' is too crowded!');

  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> channel ' + channel + ' is too crowded!'));
});

socket.on('remotePeerJoining', function (channel) {
  console.log('Request to join ' + channel);
  console.log('You are the initiator!');

  div.insertAdjacentHTML('beforeEnd', redHtmlMessage('--> Message from server: request to join channel ' + channel));
});

socket.on('joined', function (msg) {
  console.log('Message from server: ' + msg);

  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Message from server:'));
  div.insertAdjacentHTML('beforeEnd', redHtmlMessage(msg));

  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Message from server:'));
  div.insertAdjacentHTML('beforeEnd', redHtmlMessage(msg));
});

socket.on('broadcast: joined', function (msg) {
  console.log('Broadcast message from server: ' + msg);

  div.insertAdjacentHTML('beforeEnd', redHtmlMessage('--> Broadcast message from server:'));
  div.insertAdjacentHTML('beforeEnd', redHtmlMessage(msg));

  // Start chatting with remote peer:
  // 1. Get user's message
  var myMessage = prompt('Insert message to be sent to your peer:', "");
  // 2. Send to remote peer (through server)
  socket.emit('message', {
    channel: channel,
    message: myMessage
  });
});

socket.on('log', function (array) {
  console.log.apply(console, array);
});

socket.on('message', function (message) {
  console.log('Got message from other peer: ' + message);

  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Got message from other peer:'));
  div.insertAdjacentHTML('beforeEnd', blueHtmlMessage(message));

  // Send back response message:
  // 1. Get response from user
  var myResponse = prompt('Send response to other peer:', "");
  // 2. Send it to remote peer (through server)
  socket.emit('response', {
    channel: channel,
    message: myResponse
  });
});

socket.on('response', function (response) {
  console.log('Got response from other peer: ' + response);

  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Got response from other peer:'));
  div.insertAdjacentHTML('beforeEnd', blueHtmlMessage(response));

  // Keep on chatting
  var chatMessage = prompt('Keep on chatting. Write "Bye" to quit conversation', "");

  // User wants to quit conversation: send 'Bye' to remote party
  if (chatMessage == "Bye") {
    div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Sending "Bye" to server...'));

    console.log('Sending "Bye" to server');
    socket.emit('Bye', channel);

    div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Going to disconnect...'));

    console.log('Going to disconnect...');
    // Disconnect from server
    socket.disconnect();
  } else {
    // Keep on going: send response back
    // to remote party (through server)
    socket.emit('response', {
      channel: channel,
      message: chatMessage
    });
  }
});

socket.on('Bye', function () {
  console.log('Got "Bye" from other peer! Going to disconnect...');

  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Got "Bye" from other peer!'));
  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Sending "Ack" to server'));

  // Send 'Ack' back to remote party (through server)
  console.log('Sending "Ack" to server');
  socket.emit('Ack');

  // Disconnect from server
  div.insertAdjacentHTML('beforeEnd', htmlMessage('--> Going to disconnect...'));
  console.log('Going to disconnect...');
  socket.disconnect();
});

function htmlMessage(text) {
  return '<p>Time: ' + (performance.now() / 1000).toFixed(3) + ' ' + text + '</p>';
}

function redHtmlMessage(text) {
  return '<p style="color:red">Time: ' + (performance.now() / 1000).toFixed(3) + ' ' + text + '</p>';
}

function blueHtmlMessage(text) {
  return '<p style="color:blue">Time: ' + (performance.now() / 1000).toFixed(3) + ' ' + text + '</p>';
}
