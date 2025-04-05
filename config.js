require('dotenv').config();
module.exports = {
    SECRETKEY: process.env.SECRETKEY,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    SMS_APIKEY: process.env.SMS_APIKEY,
    SMS_SECRETKEY: process.env.SMS_SECRETKEY,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
};
