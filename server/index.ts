import { Server } from 'socket.io';
import { createServer } from 'http';
import SessionStore from './SessionStore';
import MessageStore from './MessageStore';
const { instrument } = require("@socket.io/admin-ui");
const crypto = require('crypto');

const messageStore = new MessageStore();
const store = new SessionStore();
const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'https://admin.socket.io'],
    }
});

instrument(io, {
    auth: false,
    mode: "development",
});

io.use((socket: any, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    console.log("sessionID on server+++++++++++++++", sessionID);
    if (sessionID) {
        const session = store.findSession(sessionID);
        if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
        }
        return next();
    }
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error('invalid username'));
    }
    console.log("sessionID not exist", sessionID);
    socket.username = username;
    socket.userID = crypto.randomBytes(8).toString('hex');
    socket.sessionID = crypto.randomBytes(8).toString('hex');
    store.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true
    });
    next();
})

io.on('connection', (socket: any) => {
    const users: any = [];
    const messages = messageStore.findMessagesForUser(socket.userID);
    const messageInfo = new Map();
    if (messages) {
        messages.forEach((message: any) => {
            const otherUser = message.from === socket.userID ? message.to : message.from;
            if (messageInfo.has(otherUser)) {
                messageInfo.get(otherUser).push({
                    ...message,
                    fromSelf: socket.userID === message.from
                });
            } else {
                const data = {
                    ...message,
                    fromSelf: socket.userID === message.from
                }
                messageInfo.set(otherUser, [data]);
            }
        })
    }
    console.log("+++++++messageInfo map++++++++++++++", messageInfo);
    store.findAllSessions().forEach((session: any) => {
        users.push({
            userID: session.userID,
            username: session.username,
            connected: session.connected,
            messages: messageInfo.get(session.userID) || [],
        });
    });
    console.log("Users on server+++++++++++++++", users);
    socket.join(socket.userID);
    // Emitting the session from server to client
    socket.emit("session", { // Third
        sessionID: socket.sessionID,
        userID: socket.userID,
    });
    socket.emit('users', users); // FIRST

    // notify existing users
    socket.broadcast.emit("user connected", { // Second
        userID: socket.userID,
        username: socket.username,
        connected: true,
    });

    socket.on("private message", ({ content, to }: any) => {
        socket.to(to).to(socket.userID).emit("private message", {
            content,
            from: socket.userID,
            to
        });
        messageStore.saveMessage({
            content,
            from: socket.userID,
            to
        }
        )
    });

    socket.on('disconnect', async () => {
        const matchingSockets = await io.in(socket.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
            socket.broadcast.emit('user disconnected', socket.userID);
            store.saveSession(socket.sessionID, {
                userID: socket.userID,
                username: socket.username,
                connected: false,
            });
        }
    })
})



httpServer.listen(3001);