import { io } from 'socket.io-client';

class MySocket {
    public socket: any;
    public URL: string;
    private onDataChange: (users: string[]) => void = () => { };
    public users: any[] = [];
    public selectedUser: any = null;
    constructor() {
        this.URL = 'http://localhost:3001';
        this.socket = io(this.URL, { autoConnect: false });
        this.socket.onAny((event: any, ...args: any) => {
            console.log(event, args);
        });
        this.socket.on("connect_error", (err: any) => {
            if (err.message === "invalid username") {
                console.log("++++++++++++++", err);
            }
        });
        this.socket.on("users", (users: any) => {
            users.forEach((user: any) => {
                user.self = user.userID === this.socket.userID;
            });
            this.users = users;
            this.onDataChange(this.users);
        });
        this.socket.on("user connected", (userData: any) => {
            // If user already exists in the users array, then set the connected property to true
            let isUserAlreadyExist = false;
            for (let i = 0; i < this.users.length; i++) {
                const user = this.users[i];
                if (user.userID === userData.userID) {
                    user.connected = true;
                    isUserAlreadyExist = true;
                    break;
                }
            }
            if (!isUserAlreadyExist) {
                this.users.push(userData);
            }
            this.onDataChange(this.users);
        });
        this.socket.on("private message", ({ content, from }: any) => {
            for (let i = 0; i < this.users.length; i++) {
                const user = this.users[i];
                if (!user.messages) {
                    user['messages'] = [];
                }
                if (user.userID === from) {
                    user.messages.push({
                        content,
                        fromSelf: false,
                    });
                    if (user !== this.selectedUser) {
                        user.hasNewMessages = true;
                    }
                    break;
                }
            }
            this.onDataChange(this.users);
        });
        this.socket.on("connect", () => {
            this.users.forEach((user) => {
                if (user.self) {
                    user.connected = true;
                }
            });
        });

        this.socket.on("user disconnected", (userID: string) => {
            this.users.forEach((user) => {
                if (user.userID === userID) {
                    user.connected = false;
                }
            });
            this.onDataChange(this.users);
        });
        this.socket.on("session", ({ sessionID, userID }: any) => {
            // attach the session ID to the next reconnection attempts
            this.socket.auth = { sessionID };
            // store it in the localStorage
            localStorage.setItem("sessionID", sessionID);
            // save the ID of the user
            this.socket.userID = userID;
        });
    }
    onUsernameSelection(username: string) {
        this.socket.auth = { username };
        // Manually connecting the socket when user clicks on send/join button
        this.socket.connect();
    }

    setUserDataChange(callback: (users: string[]) => void) {
        this.onDataChange = callback;
    }

    setSelectedUser(userID: string) {
        const user = this.users.find((user) => user.userID === userID);
        this.selectedUser = user;
    }

    onMessage(content: string) {
        if (this.selectedUser) {
            this.socket.emit("private message", {
                content,
                to: this.selectedUser.userID,
                from: this.socket.userID,
            });
            if (this.selectedUser && !this.selectedUser.messages) {
                this.selectedUser['messages'] = [];
            }
            this.selectedUser.messages.push({
                content,
                fromSelf: true,
            });
        }
    }

    connectToSocket(sessionID: string) {
        this.socket.auth = { sessionID };
        this.socket.connect();
    }
}

export default MySocket;