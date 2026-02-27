// Firebase disabled - local-only mode
function initializeFirebase() {
    console.log('[FirebaseClient] Firebase disabled, running in local-only mode.');
}

function getFirebaseAuth() {
    return null;
}

function getFirestoreInstance() {
    return null;
}

module.exports = { initializeFirebase, getFirebaseAuth, getFirestoreInstance };
