app.controller('DrawController', function($scope, $location, socket) {

    var roomId = $location.$$path.substr(1);
    socket.emit('DrawController', {lobby: roomId});

    // Block default right-click menu
    $('div.draw').ready(function() {

        $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
        // Create mouse object to track mouse clicks/position
        var mouse = {
            click: false,
            move: false,
            pos: {x:0, y:0},
            pos_prev: false
        };

        // get canvas element and create context
        var canvas  = document.getElementById('drawing');
        var context = canvas.getContext('2d');
        var width   = window.innerWidth;
        var height  = window.innerHeight;
        var dragScreen = false;
        var lastPt = null;
        var text = document.getElementById('content');
        text.value = window.location.href;

        // set canvas to full browser width/height
        canvas.width = width;
        canvas.height = height;
        // misc context/canvas settings
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = 'white';
        context.fillStyle = 'white';
        context.lineWidth = 2;
        var dataURL;
        var lastPt = null;

        // variables for text inputs
        var typing = false,
            smallTyping = false,
            erasing = false;
        context.textBaseline = 'top';

        // Dropdown menu sorcery
		//cache nav
		var nav = $("#topNav");
		//add indicators and hovers to submenu parents
		nav.find("li").each(function() {
			if ($(this).find("ul").length > 0) {
				//show subnav on hover
				$(this).mouseenter(function() {
                    if (!dragScreen) {
                        $(this).find("ul").stop(true, true).slideDown();
                    }
				});
				//hide submenus on exit
				$(this).mouseleave(function() {
					$(this).find("ul").stop(true, true).slideUp();
				});
			}
		});

        $(document).on('keydown', function(e){
            if(e.keyCode == 27){          // Pressed escape
                if(typing){
                    var tf = document.getElementById('smalltext');
                    tf.hidden = true;
                    typing = false;
                    $('#ptextinput').val('');
                }
                $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
                erasing = false;
                context.lineWidth = 2;
                context.strokeStyle = 'white';
            }
            if(e.keyCode == 13 && typing && !e.shiftKey){      // Pressed enter
                var inptext, posX, posY;
                var pText = $('#ptextinput').val();
                if(pText){
                    inptext = pText;
                    var pos = $("#smalltext").position();
                    if(context.strokeStyle == '#000000'){
                        context.fillStyle = 'white';
                    }
                    else{
                        context.fillStyle = context.strokeStyle;
                    }
                    context.font = "15px Verdana";
                    context.fillText(inptext,pos.left+10,pos.top+10);
                }
                var tf = document.getElementById('smalltext');
                tf.hidden = true;
                $('#ptextinput').val('');
                typing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});

                // Save screen to png file and send to server
                if(pText){
                    dataURL = canvas.toDataURL();
                    socket.emit('save_canv', { canvas: dataURL, lobby: roomId});
                    socket.emit('savestate', { canvas: dataURL, lobby: roomId});
                }
            }   // End of enter key if check
        });

        var smallText = false;
        // register mouse event handlers
        canvas.onmousedown = function(e){
            console.log(e.which);
            $('canvas').focus();
            if(!erasing && context.strokeStyle == '#000000'){
                context.strokeStyle = 'white';
            }

            if(!typing){
                if(e.which==1) {mouse.click = true; }
            }
            else{
                if(smallTyping && e.which != 3){    // Place small text input
                    var tf = document.getElementById('smalltext');
                    tf.hidden = false;
                    tf.style.top = e.clientY - 20 + 'px';
                    tf.style.left = e.clientX - 10 + 'px';
                    smallText = true;
                    erasing = false;
                }
            }
            if(e.which==3) {
                var menu = document.getElementById('rightmenu');
                menu.hidden = !menu.hidden;
                menu.style.top = e.clientY + 'px';
                menu.style.left = e.clientX + 'px';
            }
        };
        canvas.onmouseup = function(e){
            if(e.which==1){
                mouse.click = false;
                dataURL = canvas.toDataURL();
                socket.emit('savestate', { canvas: dataURL, lobby: roomId});
            }
        };
        $(document).mouseup(function(e) {
            if (smallText) {
                $('#ptextinput').focus();
                smallText = false;
            }
        });
        canvas.onmousemove = function(e) {
            // normalize mouse position to range 0.0 - 1.0
            mouse.pos.x = e.clientX / width;
            mouse.pos.y = e.clientY / height;
            mouse.move = true;
        };

        canvas.addEventListener("touchstart", function (e) {
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);

        canvas.addEventListener("touchend", function (e) {
            lastPt = null;
        }, false);

        canvas.addEventListener("touchmove", function (e) {
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);

        document.body.addEventListener("touchstart", function (e) {
            if (e.target == canvas) {
                e.preventDefault();
            }
        }, false);

        document.body.addEventListener("touchend", function (e) {
            if (e.target == canvas) {
                e.preventDefault();
            }
        }, false);

        document.body.addEventListener("touchmove", function (e) {
            if (e.target == canvas) {
                e.preventDefault();
            }
        }, false);

        $('#rightmenu').mousedown(function(e) {
            var curr = $(this)
            dragScreen = true;
            var left = parseInt(curr.css('left')),
                top  = parseInt(curr.css('top'));

            var lDiff = e.pageX-left,
                tDiff = e.pageY-top;

            $(document).mousemove(function(e) {
                curr.css('left', e.pageX-lDiff);
                curr.css('top', e.pageY-tDiff);
            });
        });

        $(document).mouseup(function(e) {
            if (dragScreen) {
                $(document).off('mousemove')
                dragScreen = false;
            }
        });

        // draw line received from server
        socket.on('draw_line', function (data) {
            var line = data.line;
            if (lastPt != null) {
                context.beginPath();
                context.moveTo(line[0].x * width, line[0].y * height);
                context.lineTo(line[1].x * width, line[1].y * height);
                context.strokeStyle = data.lineColor;
                context.lineWidth = data.penWidth;
                context.lineCap = 'round';
                context.lineJoin = 'round';
                context.stroke();
            }
            lastPt = {x: line[1].x * width, y:line[1].y * height };
        });

        // main loop, running every 25ms
        function mainLoop() {
            // check if the user is drawing
            if (mouse.click && mouse.move && mouse.pos_prev) {
                // send line to to the server
                socket.emit('draw_line', { path:{ line: [ mouse.pos, mouse.pos_prev ], lineColor: context.strokeStyle, penWidth: context.lineWidth }, lobby: roomId});
                mouse.move = false;
            } 
            mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
            setTimeout(mainLoop, 25);
        }
        mainLoop();
        // reset function to clear canvas
        $('#resetbtn').on('click', function(){
            socket.emit('clear_board', {lobby: roomId});
        });
        socket.on('cleared', function(){
            canvas.width = canvas.width;
            $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            context.strokeStyle = 'white';
            context.lineWidth = 2;
        });
        // Pen colors/sizes, reset buttons
        $('button').on('click', function(){
            if(this.id == 'color1'){
                context.strokeStyle = 'blue';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_blue_sm.png'), auto"});
            }
            else if(this.id == 'color2'){
                context.strokeStyle = 'red';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_red_sm.png'), auto"});
            }
            else if(this.id == 'color3'){
                context.strokeStyle = 'green';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_green_sm.png'), auto"});
            }
            else if(this.id == 'color4'){
                context.strokeStyle = 'yellow';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_yellow_sm.png'), auto"});
            }
            else if(this.id == 'color5'){
                context.strokeStyle = 'white';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            }
            else if(this.id == 'eraser'){
                context.strokeStyle = 'black';
                erasing = true;
                $('#drawing').css({'cursor':"url('../img/cursor/eraser_sm.png'), auto"});
            }
            else if(this.id == 'width1'){
                context.lineWidth = 0.5;
                if(context.strokeStyle == '#000000'){ context.lineWidth = 10; }
            }
            else if(this.id == 'width2'){
                context.lineWidth = 2;
                if(context.strokeStyle == '#000000'){ context.lineWidth = 20; }
            }
            else if(this.id == 'width3'){
                context.lineWidth = 5;
                if(context.strokeStyle == '#000000'){ context.lineWidth = 50; }
            }
            else if(this.id == 'simpText'){
                typing = true;
                smallTyping = true;
                bigTyping = false;
                $('#drawing').css({'cursor':'text'});
            }
            if(context.strokeStyle != '#000000'){
                if(context.lineWidth > 5){
                    context.lineWidth = 5;
                }
            }
        }); // End of $button.on click

        // Loading canvas from screenshot
        socket.on('load_canv', function(data){
            var board = new Image;
            board.src = data;
            canvas.width = canvas.width;
            board.onload = function() {
                context.drawImage(board,0,0, window.innerWidth, window.innerHeight);
            };
            $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            context.strokeStyle = 'white';
            context.lineWidth = 2;
        });

        socket.on('save_canv', function(data){
            dataURL = canvas.toDataURL();
            $('#save').src = dataURL;
            socket.emit('save_canv', { canvas: dataURL, lobby: roomId});
        });


        // Send invites to friend
        $("#send_email").click(function() {
            console.log('click');
            var emailto = $("#email").val();
            var subject = 'Please join our drawing';
            var content = document.getElementById('content');
            content.innerHTML = window.location.href;
            content.value = window.location.href;

            var text = 'Hi ' + emailto + ',\nPlease join our drawing at ';
            text += $("#content").val();
            $("#notification").text("Sending E-mail...Please wait");
            $.get("http://localhost:8000/send", {to: emailto, subject: subject, text: text},function(data){
                if(data=="sent") {
                    $("#notification").text("E-mail has been sent to " + emailto);
                }
            });
        });

    });  // End of div.draw ready


});
