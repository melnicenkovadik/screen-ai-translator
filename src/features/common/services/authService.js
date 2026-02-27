const { BrowserWindow } = require('electron');
const sessionRepository = require('../repositories/session');

class AuthService {
    constructor() {
        this.currentUserId = 'default_user';
        this.currentUserMode = 'local';
        this.currentUser = null;
        this.isInitialized = false;
        this.initializationPromise = null;

        sessionRepository.setAuthService(this);
    }

    initialize() {
        if (this.isInitialized) return this.initializationPromise;

        this.initializationPromise = new Promise(async (resolve) => {
            this.isInitialized = true;
            await sessionRepository.endAllActiveSessions();
            this.broadcastUserState();
            console.log('[AuthService] Initialized in local-only mode.');
            resolve();
        });

        return this.initializationPromise;
    }

    async startFirebaseAuthFlow() {
        return { success: false, error: 'Firebase auth disabled' };
    }

    async signInWithCustomToken() {
        throw new Error('Firebase auth disabled');
    }

    async signOut() {
        await sessionRepository.endAllActiveSessions();
    }
    
    broadcastUserState() {
        const userState = this.getCurrentUser();
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
                win.webContents.send('user-state-changed', userState);
            }
        });
    }

    getCurrentUserId() {
        return this.currentUserId;
    }

    getCurrentUser() {
        return {
            uid: this.currentUserId,
            email: null,
            displayName: 'Local User',
            mode: 'local',
            isLoggedIn: false,
        };
    }
}

const authService = new AuthService();
module.exports = authService;
