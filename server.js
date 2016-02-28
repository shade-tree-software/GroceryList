var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_URL);

var broadcastAll = function (client, message, data) {
    console.log("broadcasting: " + data);
    client.broadcast.emit(message, data);
    client.emit(message, data);
};

io.on('connection', function (client) {
    console.log('new client connected');
    //console.log(client.client.request.headers);
    redisClient.smembers('grocery keys', function (err, groceryKeys) {
        console.log('found grocery keys [' + groceryKeys + ']');
        groceryKeys.forEach(function (groceryKey) {
            redisClient.hgetall(groceryKey, function (err, groceryData) {
                var groceryItemJSON = JSON.stringify({key: groceryKey, data: groceryData});
                console.log('telling client to add item ' + groceryItemJSON);
                client.emit('new grocery item', groceryItemJSON);
            });
        });
    });
    client.on('new grocery item', function (groceryDataJSON) {
        console.log('received item: ' + groceryDataJSON);
        var groceryData = JSON.parse(groceryDataJSON);
        redisClient.incr('grocery key', function (err, newKey) {
            var groceryKey = 'groceries:' + newKey;
            console.log('installing item ' + groceryKey + ' ' + groceryDataJSON);
            redisClient.sadd('grocery keys', groceryKey);
            redisClient.hmset(groceryKey, groceryData);
            broadcastAll(client, "new grocery item", JSON.stringify({key: groceryKey, data: groceryData}));
        });
    });
    client.on('remove grocery item', function (groceryKey) {
        console.log("received remove request for item " + groceryKey);
        redisClient.del(groceryKey);
        redisClient.srem('grocery keys', groceryKey);
        broadcastAll(client, "remove grocery item", groceryKey);
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

