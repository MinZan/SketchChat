//Require the controller
var main = require('../controllers/main.js');
var nodemailer = require("nodemailer");

//////////////////////////////////////////////////////////
//                        Routes                        //
//////////////////////////////////////////////////////////
module.exports = function(app) {
    // app.get('/', function(req, res) {
    //     main.index(req, res);
    // })
    app.get('/null', function(req, res) {
        console.log('reached null....error')
    });

	////////////////////////////////////////////////////////////
	//                    SMTP Server                         //
	////////////////////////////////////////////////////////////
	var smtpTransport = nodemailer.createTransport("SMTP",{
	    host: 'smtp.gmail.com',
	    port: 587,
	    auth: {
	        user: 'sketchchat2016@gmail.com',
	        pass: 'theinminzantmz'
	    },
	    tls: {rejectUnauthorized: false},
	    debug:true
	});

    app.get('/send', function (req, res) {
    	var mailOptions = {
    		to: req.query.to,
    		subject: req.query.subject,
    		text: req.query.text
    	};

    	console.log(mailOptions);
    	smtpTransport.sendMail(mailOptions, function(error, response) {
    		if (error) {
    			console.log(error);
    			res.send("error");
    		} else {
    			console.log("Message sent: " + response.message);
    			res.end("sent");
    		}
    	});
    });
}
