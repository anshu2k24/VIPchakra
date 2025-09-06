const crypto = require('crypto');

/**
 * Generates a random 6-digit numeric OTP.
 * @returns {string} The generated OTP as a string.
 */
const generateOtp = () => {

    const otp = crypto.randomInt(100000, 1000000);
    return otp.toString();
};

module.exports = {
    generateOtp,
};