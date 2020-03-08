$(function () {

    let info = { message: "", nickname: "", color: "111111"};

    let socket = io();

    socket.emit('cookie', Cookies.get('user'));
    if(Cookies.get('color') !== null) {
        info.color = Cookies.get('color');
    }
    //https://stackoverflow.com/questions/41333648/how-to-get-true-or-false-if-a-number-is-hexadecimal-or-not
    function isValidColor(str) {
        return str.match(/^[a-f0-9]{6}$/i) !== null;
    }

    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        $('.error').hide("slow", "linear");
        info.message = $('#message').val()

        changeNick = info.message.slice(0, 6);
        changeColor = info.message.slice(0, 11);
        changeColorRest = info.message.slice(11);
        if (changeNick.localeCompare("/nick ") === 0 && info.message.length > 6) {
            socket.emit('change nickname', info);
        } else if (changeColor.localeCompare("/nickcolor ") === 0 && changeColorRest.length === 6) {
            if(isValidColor(changeColorRest)) {
                info.color = changeColorRest;
                Cookies.set('color', changeColorRest);
                $('.error').empty();
                $('.error').css("color", "green");
                $('.error').append("Nickname Color Changed");
                $('.error').show("slow", "linear");   
                socket.emit('change color', info);
            } else {
                $('.error').empty();
                $('.error').css("color", "red");
                $('.error').append("Please enter valid HEX");
                $('.error').show("slow", "linear");
            }
        } else {
            socket.emit('chat message', info);
        }

        $('#message').val('');
        return false;
    });

    socket.on('chat message', function (socketInfo) {
        let time = socketInfo.time;
        let message = socketInfo.message;
        let name = socketInfo.nickname;
        let color = socketInfo.color;
        let strongStart = "";
        let strongEnd = "";
        if(name === info.nickname) {
            strongStart = "<strong>";
            strongEnd = "</strong>";
        }

        // https://stackoverflow.com/questions/3562202/setting-a-scrollbar-position
        $('.chatbox').append('<li class="list-group-item chatMessages">' + '<i>' + time + '</i>' + ' ' + '<span style="color: #' + color + ';">' + name + '</span>' + ': ' + strongStart + message + strongEnd + '</li>');
        let last = $('.chatMessages').length;
        $('.chatbox')[0].scrollTop = $('.chatMessages')[last - 1].offsetTop;
    });

    socket.on('nickname', function (sockets) {

        $('#username').append("You are " + sockets[sockets.length - 1].nickname);
        info.nickname = sockets[sockets.length - 1].nickname;
        Cookies.set('user', info.nickname);

    });

    socket.on('update users', function (sockets) {
        $('.users').empty();
        for (i = 0; i < sockets.length; i++) {
            $('.users').append('<li class="userList">' + sockets[i].nickname + '</li>');
            let last = $('.userList').length;
            $('.users')[0].scrollTop = $('.userList')[last - 1].offsetTop;
        }
    });

    socket.on('chat history', function (messages) {
        let time = "";
        let user = "";
        let message = "";

        for (let x in messages) {
            time = messages[x].timestamp;
            user = messages[x].user;
            message = messages[x].message;

            // https://stackoverflow.com/questions/3562202/setting-a-scrollbar-position
            $('.chatbox').append('<li class="list-group-item chatMessages">' + time + ' ' + user + ': ' + message + '</li>');
            let last = $('.chatMessages').length;
            $('.chatbox')[0].scrollTop = $('.chatMessages')[last - 1].offsetTop;
        }

    })

    socket.on('change nickname success', function (newNickname) {
        info.nickname = newNickname;
        $('#username').empty();
        $('#username').append("You are " + newNickname);
        $('.error').empty();
        $('.error').css("color", "green");
        $('.error').append("Nickname Changed");
        $('.error').show("slow", "linear"); 
        Cookies.set('user', info.nickname);

    });

    socket.on('change nickname fail', function (msg) {
        $('.error').empty();
        $('.error').css("color", "red");
        $('.error').append("Nickname already exists");
        $('.error').show("slow", "linear");
    });

});