// Migration service disabled - Firebase removed
async function checkAndRunMigration() {
    console.log('[MigrationService] Firebase migration disabled, skipping.');
}

module.exports = { checkAndRunMigration };
