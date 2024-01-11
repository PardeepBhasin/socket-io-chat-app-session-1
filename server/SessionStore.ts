class SessionStore {
    public sessions = new Map();
    public saveSession(sessionID: string, session: any) {
        this.sessions.set(sessionID, session);
    }
    public findSession(sessionID: string) {
        return this.sessions.get(sessionID);
    }

    public findAllSessions() {
        return [...this.sessions.values()];
    }
}

export default SessionStore;