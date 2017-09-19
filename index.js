var static = require('node-static');
var http = require('http');
var file = new (static.Server)();

var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(8181);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
  socket.on('message', function (message) {
    log('S --> Got message: ', message);
    socket.broadcast.to(message.channel).emit('message', message.message);
  });

  socket.on('create or join', function (channel) {
    var clientsInRoom = io.sockets.adapter.rooms[channel];
    var numClients = clientsInRoom ? clientsInRoom.length : 0;

    console.log('numclients = ' + numClients);

    if (numClients == 0) {
      socket.join(channel); socket.emit('created', channel);
    } else if (numClients == 1) {
      io.sockets.in(channel).emit('remotePeerJoining', channel);

      // Let the new peer join channel
      socket.join(channel);
      socket.broadcast.to(channel).emit('broadcast: joined', 'S --> broadcast(): client ' + socket.id + ' joined channel ' + channel);
    } else {
      console.log("Channel full!");
      socket.emit('full', channel);
    }
  });

  socket.on('response', function (response) {
    log('S --> Got response: ', response);
    // Just forward message to the other peer
    socket.broadcast.to(response.channel).emit('response', response.message);
  });

  socket.on('Bye', function (channel) {
    // Notify other peer
    socket.broadcast.to(channel).emit('Bye');

    // Close socket from server's side
    socket.disconnect();
  });

  socket.on('Ack', function () {
    console.log('Got an Ack!');

    // Close socket from server's side
    socket.disconnect();
  });

  function log() {
    var array = [">>> "];
    for (var i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
      socket.emit('log', array);
    }
  }
});
