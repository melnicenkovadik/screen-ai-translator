const { notarize } = require('@electron/notarize');
const path = require('path');

// electron-builder expects a default export (module.exports)
module.exports = async function notarizeApp(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const { appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  const shouldNotarize = process.env.NOTARIZE === 'true' || process.env.CI === 'true';
  if (!shouldNotarize) {
    console.log('Skipping notarization (set NOTARIZE=true to enable).');
    return;
  }

  const usingAppleId = !!(process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD && process.env.APPLE_TEAM_ID);
  const usingApiKey = !!(process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER);

  if (!usingAppleId && !usingApiKey) {
    throw new Error('Missing notarization credentials. Provide APPLE_ID/APPLE_ID_PASSWORD/APPLE_TEAM_ID or APPLE_API_KEY/APPLE_API_KEY_ID/APPLE_API_ISSUER.');
  }

  const options = {
    appBundleId: 'com.pickle.glass',
    appPath,
    tool: 'notarytool',
  };

  if (usingAppleId) {
    options.appleId = process.env.APPLE_ID;
    options.appleIdPassword = process.env.APPLE_ID_PASSWORD;
    options.teamId = process.env.APPLE_TEAM_ID;
  } else {
    options.appleApiKey = process.env.APPLE_API_KEY;
    options.appleApiKeyId = process.env.APPLE_API_KEY_ID;
    options.appleApiIssuer = process.env.APPLE_API_ISSUER;
  }

  console.log('Submitting app for notarization...');
  await notarize(options);
  console.log(`Successfully notarized ${appName}`);
};