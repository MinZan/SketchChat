////////////////////////////////////////////////////////////
//                        VARIABLE                        //
////////////////////////////////////////////////////////////
var allLobbies  = [],
    allUsers    = [];

//console.log( io.sockets.adapter.rooms );
////////////////////////////////////////////////////////////
//                   CLASS DECLARATIONS                   //
////////////////////////////////////////////////////////////
function Lobby ( id ) {
    var valid = 'abcdefghijklmnopqrstuvqxyz1234567890'.split('');

    this.users          = [];
    this.line_history   = [];
    this.chat_history   = [];
    this.screenshot     = '';
    this.savestate;
    this.codestate;
    this.showCode = false;

    this.id             =  id;

    if (!id) {
        this.id = Generate();
        for (var i = 0; i < allLobbies.length; i++) {
            if (allLobbies[i].id == this.id) {
                this.id = '' + Generate();
                i = 0;
            }
        }
    }

    function Generate(i) {
        i = i?i+1:1;
        if (i >= 10) {
            return valid[Math.floor(Math.random()*valid.length)];
        }
        return Generate(i) + valid[Math.floor(Math.random()*valid.length)];
    }

    this.roomContains = function(user) {
        for (i in this.users) {
            if (this.users[i].id == user.id) {
                return i;
            }
        }
        return false;
    }
}
function User ( id ) {
    this.id     = id;
    this.name;
}
function Chat ( name, message ) {
    this.name       = name;
    this.message    = message;
}
////////////////////////////////////////////////////////////
//                    HELPER FUNCTIONS                    //
////////////////////////////////////////////////////////////
function grabRoom( id, lobbyList, i ) {
    i = i==undefined?0:i;
    if (i >= lobbyList.length) {
        return false;
    }
    return lobbyList[i].id==id?lobbyList[i]:grabRoom( id, lobbyList, i+1 );
}
////////////////////////////////////////////////////////////
//                     MODULE EXPORTS                     //
////////////////////////////////////////////////////////////
module.exports = function(io) {
    var allUsers        = [],
        allLobbies      = [],
        line_history    = [];

    io.sockets.on('connection', function(socket) {
        var user = new User( socket.id );
        allUsers.push(user);

        socket.on('disconnect', function(socket) {
            allUsers.splice(allUsers.indexOf(user),1);
        })

        ////////////////////////////////////////////////////////////
        //                    LOBBY CONTROLLER                    //
        ////////////////////////////////////////////////////////////
        socket.on('createLobby', function(data) {
            user.name = data.user;

            var lobby = new Lobby();
            allLobbies.push(lobby);
            lobby.users.push(user);

            socket.join(lobby.id);

            io.to(lobby.id).emit('lobbyStatus', {lobby});
        })

        socket.on('joinLobby', function(data) {
            user.name = data.user;

            var lobby;
            for (var room of allLobbies) {
                if (room.id == data.lobby) {
                    lobby = room;
                }
            }
            if (lobby) {
                lobby.users.push(user);

                socket.join(lobby.id);

                io.to(lobby.id).emit('lobbyStatus', {lobby});
            } else {
                var lobby = new Lobby( data.lobby );
                allLobbies.push(lobby);

                socket.join(lobby.id);
                lobby.users.push(user);
                io.to(lobby.id).emit('lobbyStatus', {lobby});
            }
        })

        ///////////////////////////////////////////////////////////
        //                    DRAW CONTROLLER                    //
        ///////////////////////////////////////////////////////////
        socket.on('DrawController', function(data) {
            var room = grabRoom(data.lobby, allLobbies);
            console.log('test room id in socket.on draw: ', room.id);
            if (!room) {
                room = new Lobby(data.lobby);
                allLobbies.push(room);
                socket.join(room.id);
            } else {
                socket.join(room.id);
                socket.emit('load_canv', room.savestate)
            }
        })
        socket.on('draw_line', function (data) {
            var room = grabRoom(data.lobby, allLobbies);
            room.line_history.push(data.path);
            io.to(data.lobby).emit('draw_line', data.path);
        });
        socket.on('clear_board', function(data){
            var room = grabRoom(data.lobby, allLobbies);
            room.line_history = [];
            room.savestate = '';
            io.to(room.id).emit('cleared');
        });
        socket.on('save_canv', function(data){
            var room = grabRoom(data.lobby, allLobbies);
            room.screenshot = data.canvas;
            io.to(room.id).emit('save_canv', data.canvas);
        });
        socket.on('get_canv', function(data){
            var room = grabRoom(data.lobby, allLobbies);
            io.emit('get_canv', room);
        });
        socket.on('load_canv', function(data){
            var room = grabRoom(data.lobby, allLobbies);
            room.savestate = room.screenshot;
            io.to(room.id).emit('load_canv', room.screenshot);
        });
        socket.on('savestate', function(data) {
            var room = grabRoom(data.lobby, allLobbies);
            room.savestate = data.canvas;
        });

        ////////////////////////////////////////////////////////////
        //                    CHATS CONTROLLER                    //
        ////////////////////////////////////////////////////////////
        socket.on('ChatController', function(data) {
            var room = grabRoom(data.lobby, allLobbies);
            io.to(data.lobby).emit('messageReceive', room.chat_history);
        })
        socket.on('messageSend', function(data) {
            var message = new Chat( data.message.name, data.message.message );
            var room = grabRoom(data.lobby, allLobbies);
            room.chat_history.push(message);

            io.to(data.lobby).emit('messageReceive', room.chat_history);
        })
        socket.on('joinChat', function(data) {
            var message = new Chat( '-----',data.name+' has joined the lobby.');
            var room = grabRoom( data.lobby, allLobbies );
            var found = false;
            for(var user of room.users){
                if(user.id == '/#'+data.id){
                    found = true;
                    user.name = data.name;
                }
            }
            if(!found){
                room.users.push({id: '/#'+data.id, name: data.name});
            }
            room.chat_history.push(message);

            io.to(data.lobby).emit('messageReceive', room.chat_history);
        })
        socket.on('left_chat', function(data){
            if(data.name){
                var message = new Chat('-----',data.name+' has left the lobby.')
                var room = grabRoom( data.lobby, allLobbies );

                room.chat_history.push(message);

                io.to(data.lobby).emit('messageReceive', room.chat_history);
            }
        })
    })
}
