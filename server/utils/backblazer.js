const B2 = require('backblaze-b2');

const applicationKeyId = process.env.BACKBLAZE_APP_KEY_ID;
const applicationKey = process.env.BACKBLAZE_APP_KEY;

const b2 = new B2({
    applicationKeyId: applicationKeyId,
    applicationKey: applicationKey
});

module.exports = b2;
