var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var groceryItems = [];
var index = 0;

var broadcastAll = function (client, message, data) {
    console.log("broadcasting: " + data);
    client.broadcast.emit(message, data);
    client.emit(message, data);
};

io.on('connection', function (client) {
    groceryItems.forEach(function (grocery_item) {
        client.emit('new grocery item', JSON.stringify(grocery_item));
    });
    client.on('new grocery item', function (new_grocery_item) {
        console.log('received item: ' + new_grocery_item);
        var grocery_item = {index: index++, item: new_grocery_item};
        groceryItems.push(grocery_item);
        broadcastAll(client, "new grocery item", JSON.stringify(grocery_item));
    });
    client.on('remove grocery item', function(index){
        console.log("received remove request for item: " + index);
        for (i=0; i<groceryItems.length; i++){
            if (groceryItems[i].index === index){
                groceryItems.splice(i, 1);
                break;
            }
        }
        broadcastAll(client, "remove grocery item", index);
    });
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/js/:filename', function (req, res) {
    res.sendFile(__dirname + '/js/' + req.params.filename);
});

app.get('/css/:filename', function (req, res) {
    res.sendFile(__dirname + '/css/' + req.params.filename);
});

server.listen(process.env.PORT || 8080);

