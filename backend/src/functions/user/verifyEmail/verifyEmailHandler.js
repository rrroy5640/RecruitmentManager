const { verifyEmail } = require("./verifyEmailService");

exports.handler = async (event) => {
    const { email, code } = event.body;
    const response = await verifyEmail(email, code);
    return response;
};  