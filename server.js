//////////////////////////////////////////////////////////
//                      Requires                        //
//////////////////////////////////////////////////////////
var bodyParser      = require("body-parser");
var express         = require("express");
var path            = require("path");
var app             = express();

//Body Parser && Static Folder
app.use(bodyParser.json());
app.use(express.static(__dirname + "/client/static"));

//Routes require
// require('./server/config/mongoose.js');
require('./server/config/routes.js')(app)

////////////////////////////////////////////////////////////
//                     Listen to Port                     //
////////////////////////////////////////////////////////////

//for heroku
var port = process.env.PORT || 8080;

//for local
//var port = 8000;
var server = app.listen(port, function() {
    console.log("Hey, Listen! (ROOOOM "+port+")");
})
////////////////////////////////////////////////////////////
//                         Socket                         //
////////////////////////////////////////////////////////////
var io  =   require('socket.io').listen(server);
            require('./server/config/socket.js')(io);

