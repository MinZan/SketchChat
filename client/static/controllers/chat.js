app.controller('ChatController', function($scope, socket, $location) {

    // Send user info on disconnect
    $(window).on('beforeunload', function(){
        if($scope.currentName){
            socket.emit('left_chat', {name: $scope.currentName, lobby: $scope.lobby});
        }
    });

    var log         = [],
        option      = {
            shft    : false
        }

    $scope.lobby    = $location.$$path.substr(1);
    $scope.chatbox  = '';
    $scope.currentName;


    socket.emit('ChatController', {lobby: $scope.lobby});

    var height = parseInt($('div.chat').height())-32;
    $('div.chat').css('bottom', '-'+height);

    $('.chat').width( $('.chat').width( parseInt($(window).width())-24  ))
    $('.chat').css('right', -1);

    $(window).resize(function(e) {
        $('.chat').width( $('.chat').width( parseInt($(window).width())-24  ))
        $('.chat').css('right', -1);
            $('.cover').height( $('.chat').height() );
            $('.cover').width( $('.chat').width() );
            $('.cover').css('bottom', $('.chat').css('bottom'));
            $('.cover').css('right', $('.chat').css('right'));
    })

    if (!$scope.currentName || $scope.currentName.trim().length <= 1) {
        $('.cover').height( $('.chat').height() );
        $('.cover').width( $('.chat').width() );
        $('.cover').css('bottom', $('.chat').css('bottom'));
        $('.cover').css('right', $('.chat').css('right'));
    }
    $('.cover').click(function(e) {
        $('.chatDisplayName').focus();
        e.stopPropagation();
        var bottom = parseInt($('div.cover').css('bottom'));
        var bottom = parseInt($('div.chat').css('bottom'));

        if (bottom < 0) {
            $('div.cover').animate({bottom: 0}, 500);
            $('div.chat').animate({bottom: 0}, 500);
            $('.chatDisplayName').focus();
        } else {
            var height = parseInt($('div.cover').height())-32;
            $('div.cover').animate({bottom: '-'+height}, 500);
            var height = parseInt($('div.chat').height())-32;
            $('div.chat').animate({bottom: '-'+height}, 500);
        }
    })
    $(document).keydown(function(e) {
        if (e.keyCode == 16) {
            option.shft = true;
        }
    })
    $(document).keyup(function(e) {
        if (e.keyCode == 16) {
            option.shft = false;
        }
        if (e.keyCode == 192 && option.shft && $scope.currentName) {
            $('.chatTextArea').blur();
            e.preventDefault();
            $scope.toggleChat();
        }
    })
    $('.chatDisplayName').click(function(e) {e.stopPropagation();})
    $('.chat input').click(function(e) {e.stopPropagation();})

    socket.on('messageReceive', function(data) {
        log = data;
        html = '';
        for (message of log) {
            html+='<div class="row">'+
            '<div class="columns two">'+message.name+
            '</div><div class="columns ten">'+message.message+
            '</div>'+'</div>';
        };
        $('div.chatCol').html(html);
        $('div.chatCol').scrollTop($('div.chatCol')[0].scrollHeight)
    })
    $('.chatForm').keypress(function(e) {
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            if ($scope.chatbox != '' && $scope.currentName) {
                sendMessage();
            }
        }
    })
    var sendMessage = function() {
        var chatValid = $('.chatTextArea').val()?true:false;
        var nameValid = $scope.currentName?true:false;
        if ($scope.currentName && $scope.currentName != '' && chatValid && nameValid) {
            var message = {name: $scope.currentName, message: $('.chatTextArea').val()};

            socket.emit('messageSend', {lobby: $scope.lobby, message: message});
            $('.chatTextArea').val('');
        }
    }

    $scope.toggleChat = function() {
        var bottom = parseInt($('div.chat').css('bottom'));

        if (bottom < 0) {
            $('div.chat').animate({bottom: 0}, 500);
            $('.chatTextArea').focus();
        } else {
            var height = parseInt($('div.chat').height())-24;
            $('div.chat').animate({bottom: '-'+height}, 500);
            if ($('.chatTextArea').focus()) {
                $('.chatTextArea').blur();
            }
        }
    }
    $scope.setName = function() {
        if ($scope.displayName && $scope.displayName.trim().length > 1) {
            $scope.currentName = $scope.displayName;
            //Send User
            socket.emit('joinChat', {id: socket.currentId(), name: $scope.currentName, lobby: $scope.lobby});
            $('.cover').hide();
            $('.chatTextArea').focus();
        }
    }
   
    $scope.save_canv = function(){
        socket.emit('get_canv', {lobby: $scope.lobby});
    }
    $scope.load_canv = function(){
        var r = confirm("Loading will discard all unsaved changes. Load anyway?");
        if (r) {
            socket.emit('load_canv', {lobby: $scope.lobby});
        }
    }

})
