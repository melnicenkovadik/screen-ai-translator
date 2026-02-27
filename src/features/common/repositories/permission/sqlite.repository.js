const sqliteClient = require('../../services/sqliteClient');

function markKeychainCompleted(uid) {
    return sqliteClient.query(
        'INSERT OR REPLACE INTO permissions (uid, keychain_completed) VALUES (?, 1)',
        [uid]
    );
}

function checkKeychainCompleted(uid) {
    const row = sqliteClient.query('SELECT keychain_completed FROM permissions WHERE uid = ?', [uid]);
    return row.length > 0 && row[0].keychain_completed === 1;
}

function markPermissionsCompleted(uid) {
    return sqliteClient.query(
        'INSERT OR REPLACE INTO permissions (uid, keychain_completed, permissions_skipped) VALUES (?, COALESCE((SELECT keychain_completed FROM permissions WHERE uid = ?), 0), 1)',
        [uid, uid]
    );
}

function checkPermissionsCompleted(uid) {
    const row = sqliteClient.query('SELECT permissions_skipped FROM permissions WHERE uid = ?', [uid]);
    return row.length > 0 && row[0].permissions_skipped === 1;
}

module.exports = {
    markKeychainCompleted,
    checkKeychainCompleted,
    markPermissionsCompleted,
    checkPermissionsCompleted
}; 