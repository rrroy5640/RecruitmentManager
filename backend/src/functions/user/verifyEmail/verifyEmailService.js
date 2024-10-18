const { CognitoIdentityProviderClient, ConfirmSignUpCommand } = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient();

exports.verifyEmail = async (email, code) => {
    try {
        const command = new ConfirmSignUpCommand({
            ClientId: process.env.USER_POOL_CLIENT_ID,
            Username: email,
            ConfirmationCode: code
        });

        await cognitoClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email verified successfully' }),
        };
    } catch (error) {
        console.error("Error verifying email:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to verify email' }),
        };
    }
};