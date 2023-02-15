const express = require("express");
const app = express();
const PORT = 3000;
const http = require("http");
const socketio = require("socket.io");

const redis = require("redis");
const client = redis.createClient();
const client1 = redis.createClient();

app.set("view engine", "ejs");

const server = http.createServer(app);
const io = socketio(server).listen(server);

function sendMessage(socket,from) {
    // console.log(from);
    client1.smembers("users", (err, data) => {
                data.map(x => {
                    const userMessage = x.split(":");
                    const Username = userMessage[0];
                    const Id = userMessage[1];
                    // console.log(Id);
                    // console.log(Username);
                    if(from == Username){
                        client.lrange("messages", "0", "-1", (err, data) => {
                            data.map(x => {
                                const usernameMessage = x.split(":");
                                const redisUsername = usernameMessage[0];
                                const redisMessage = usernameMessage[1];
                                const redisReciever=usernameMessage[2];
                                // console.log("ssss");
                                if(from == redisReciever){
                                    console.log(redisReciever);
                                    // socket.to(Id).emit("msg", {
                                    // // from: redisUsername,
                                    // message: redisMessage
                                    // // to:redisReciever
                                    // });

                                   io.sockets.in(Id).emit('msg', redisMessage); 
                                }
                                
                                // publisher.publish(redisReciever, JSON.stringify(message))
                            });
                        });
                    }
                    // publisher.publish(redisReciever, JSON.stringify(message))
                });
            });
    // client.lrange("messages", "0", "-1", (err, data) => {
    //     data.map(x => {
    //         const usernameMessage = x.split(":");
    //         const redisUsername = usernameMessage[0];
    //         const redisMessage = usernameMessage[1];
    //         const redisReciever=usernameMessage[2];
    //         socket.emit("message", {
    //             // from: redisUsername,
    //             message: redisMessage,
    //             to:redisReciever
    //         });
    //         // publisher.publish(redisReciever, JSON.stringify(message))
    //     });
    // });
}

io.on("connection", socket => {
    socket.on("m", ({socketId,from}) => {
        console.log(socketId);
        // client1.rpush("users", `${from}:${socketId}`);    });
        client1.sadd(['users', `${from}:${socketId}`]);
        // console.log("x");
        socket.join(socketId);
        io.sockets.in(socketId).emit('connectToRoom', "You are in room no. "+socketId);

        sendMessage(socket,`${from}`);

    });
        // console.log(socketId);
    // sendMessage(socket);

    socket.on("message", ({ message, from, to, socketId}) => {
            // console.log(socketId);
            // console.log(message,from,to);
            client.rpush("messages", `${from}:${message}:${to}`);
            // console.log(`${to}`)
            client1.smembers("users", (err, data) => {
                data.map(x => {
                    const usernameMessage = x.split(":");
                    const redisUsername = usernameMessage[0];
                    const redisMessage = usernameMessage[1];
                    if(`${to}` == redisUsername){
                        io.sockets.in(redisMessage).emit("message", {message });
                    }
                    // publisher.publish(redisReciever, JSON.stringify(message))
                });
            });
        
    });
});

app.get("/chat", (req, res) => {
    const username = req.query.username;
    // client1.rpush("users", '${username}:${socketId}');
    // console.log(socket.id);
    io.emit("joined", username);
    res.render("chat", { username });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(PORT, () => {
    console.log(`Server at ${PORT}`);
});
