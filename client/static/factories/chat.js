app.factory('ChatFactory', function(socket) {
    var factory = {}
    var log = [];

    socket.on('chatIndex', function(data) {
        log = data;
    })
    socket.on('receive', function(data) {
        log.push(data);
    })
    factory.index = function(callback) {
        callback(log);
    }
    factory.send = function(message, callback) {
        if ( message.message && message.name != '' ) {
            log.push(message);
            callback(message);
        }
    }

    return factory;
})
