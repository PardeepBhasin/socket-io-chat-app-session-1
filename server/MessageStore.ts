class MessageStore {
    private messages: any = [];

    public saveMessage(message: any) {
        this.messages.push(message);
    }

    public findMessagesForUser(userID: string) {
        return this.messages.filter((message: any) => (message.to === userID || message.from === userID))
    }
}
export default MessageStore;

// save message