var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = null;
var redisClient = null;
var ioClient = null;
var master = null;
var isMaster = (process.env.MASTER === 'true');
var isSlave = !isMaster;

var broadcastAll = function (client, message, data) {
    console.log("broadcasting '" + message + "' for " + data);
    client.broadcast.emit(message, data);
    client.emit(message, data);
};

var handleClientConnections = function () {
    io.on('connection', function (client) {
        console.log('new client connected');
        client.on('request all', function () {
            console.log("received 'request all' from client");
            if (isMaster) {
                redisClient.smembers('grocery keys', function (err, groceryKeys) {
                    console.log('found grocery keys [' + groceryKeys + ']');
                    groceryKeys.forEach(function (groceryKey) {
                        redisClient.hgetall(groceryKey, function (err, groceryData) {
                            var groceryItemJSON = JSON.stringify({key: groceryKey, data: groceryData});
                            console.log("sending 'new grocery item' to client " + groceryItemJSON);
                            client.emit('new grocery item', groceryItemJSON);
                        });
                    });
                });
            } else {
                console.log("sending 'request all' to master");
                master.emit('request all');
            }
        });
        client.on('new grocery item', function (groceryDataJSON) {
            console.log("received 'new grocery item' for " + groceryDataJSON);
            if (isMaster) {
                var groceryData = JSON.parse(groceryDataJSON);
                redisClient.incr('grocery key', function (err, newKey) {
                    var groceryKey = 'groceries:' + newKey;
                    console.log('installing item ' + groceryKey + ' ' + groceryDataJSON);
                    redisClient.sadd('grocery keys', groceryKey);
                    redisClient.hmset(groceryKey, groceryData);
                    broadcastAll(client, "new grocery item", JSON.stringify({key: groceryKey, data: groceryData}));
                });
            } else {
                console.log("sending 'new grocery item' to master " + groceryDataJSON);
                master.emit('new grocery item', groceryDataJSON);
            }
        });
        client.on('remove grocery item', function (groceryKey) {
            console.log("received 'remove grocery item' for " + groceryKey);
            if (isMaster) {
                redisClient.del(groceryKey);
                redisClient.srem('grocery keys', groceryKey);
                broadcastAll(client, "remove grocery item", groceryKey);
            } else {
                console.log("sending 'remove grocery item' to master for " + groceryKey);
                master.emit('remove grocery item', groceryKey);
            }
        });
        client.on('add item to cart', function (groceryKey) {
            console.log("received 'add item to cart' for " + groceryKey);
            if (isMaster) {

            } else {
                console.log("sending 'add item to cart' to master for " + groceryKey);
                master.emit('add item to cart', groceryKey);
            }
        });
    });
};

var handleMasterConnections = function () {
    master.on('new grocery item', function (groceryItemJSON) {
        console.log("received 'new grocery item' from master " + groceryItemJSON);
        console.log("broadcasting 'new grocery item' for " + groceryItemJSON);
        io.sockets.emit("new grocery item", groceryItemJSON);
    });
    master.on('remove grocery item', function (groceryKey) {
        console.log("received 'remove grocery item' from master for " + groceryKey);
        console.log("broadcasting 'remove grocery item' for " + groceryKey);
        io.sockets.emit("remove grocery item", groceryKey);
    });
};

if (isSlave) {
    console.log("running as slave, connecting to master");
    ioClient = require('socket.io-client');
    master = ioClient.connect('http://hamilton-groceries.herokuapp.com', {reconnect: true});
    master.on('connect', function () {
        console.log('connected to master');
        handleMasterConnections();
        handleClientConnections();
    });
}

if (isMaster) {
    console.log("running as master, connecting to redis");
    redis = require('redis');
    redisClient = redis.createClient(process.env.REDIS_URL);
    handleClientConnections();
}

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

