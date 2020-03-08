let express = require('express');
let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
const { uniqueNamesGenerator, adjectives, names, colors } = require('unique-names-generator');
let sockets = [];
let randomName = "";
let seconds = "";
let minutes = "";
let hours = "";
let messages = [];


app.use('/', express.static('public'));


io.on('connection', function (socket) {
    console.log("A User has connected");

    socket.on('cookie', function (cookie) {
        let duplicate = false;
        let index = sockets.findIndex(user => user.nickname === cookie);
        if (index !== -1) {
        duplicate = true;
        } 
        if (cookie === null || duplicate) {
            console.log("New User");
            randomName = uniqueNamesGenerator({ dictionaries: [adjectives, names, colors], separator: "", style: 'capital', length: 2 });
            sockets.push({ nickname: randomName, socket: socket.id, color : "", time: ""});
            socket.emit('nickname', sockets);
            io.emit('update users', sockets);

        } else {
            console.log("Existing User");
            sockets.push({ nickname: cookie, socket: socket.id, color : "", time : "" });
            socket.emit('nickname', sockets);         
            io.emit('update users', sockets);
            
        }

        if (messages.length !== 0) {
            socket.emit('chat history', messages);
        }
    })

    socket.on('disconnect', function () {
        console.log("A User has disconnected");
        let index = sockets.findIndex(user => user.socket === socket.id);
        //console.log(sockets[index].nickname + 'has disconnected');
        sockets.splice(index, 1);
        io.emit('update users', sockets);
    });

    socket.on('chat message', function (info) {
        //console.log('message: ' + info.message);
        let hours = (new Date().getHours() < 10 ? '0' : '') + new Date().getHours();
        let minutes = (new Date().getMinutes() < 10 ? '0' : '') + new Date().getMinutes();
        let seconds = (new Date().getSeconds() < 10 ? '0' : '') + new Date().getSeconds();
        let time = (hours + ":" + minutes + ":" + seconds);
        index = sockets.findIndex(user => user.nickname === info.nickname);
        if(index !== -1) {
            sockets[index].time = time;
            sockets[index].message = info.message;
            sockets[index].color = info.color;
    
            messages.push({ timestamp: time, user: info.nickname, message: info.message });
    
            io.emit('chat message', sockets[index]);
        }

    });

    socket.on('change nickname', function (info) {
        let duplicate = false;

        changeNickname = info.message.slice(6);
        index = sockets.findIndex(user => user.nickname === info.nickname);
        oldNickname = sockets[index].nickname;
        lowerChange = changeNickname.toLowerCase();
        for (let element in sockets) {
            if (sockets[element].nickname.toLowerCase().localeCompare(lowerChange) === 0) {
                duplicate = true;
            }
        }

        if (duplicate) {
            msg = "Sorry cannot change";
            socket.emit('change nickname fail', msg);
        } else {
            sockets[index].nickname = changeNickname;
            socket.emit('change nickname success', changeNickname);
            io.emit('update users', sockets);
        }


    })

    socket.on('change color', function(info) {
        index = sockets.findIndex(user => user.nickname === info.nickname);
        sockets[index].color = info.color;
    });

});

http.listen(3000, function () {
    console.log("Listening on *:3000");
});