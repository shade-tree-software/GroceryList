var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var broadcastNewItem = function(client, new_grocery_item){
  client.broadcast.emit('new grocery item', new_grocery_item);
  client.emit('new grocery item', new_grocery_item);
};

io.on('connection', function(client){
  client.on('new grocery item', function(new_grocery_item){
    broadcastNewItem(client, new_grocery_item);
  });
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/js/:filename', function(req, res) {
  res.sendFile(__dirname + '/js/' + req.params.filename);
});

app.get('/css/:filename', function(req, res) {
  res.sendFile(__dirname + '/css/' + req.params.filename);
});

server.listen(process.env.PORT || 8080);

