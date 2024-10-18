const { CognitoIdentityProviderClient, AdminCreateUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient();

async function registerUser({ email, password }) {
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    const params = {
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
        MessageAction: 'SUPPRESS',
        TemporaryPassword: password,
        UserAttributes: [
            { Name: 'email', Value: email },
        ],
    };

    try {
        const command = new AdminCreateUserCommand(params);
        await cognitoClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User registered successfully' }),
        };
    } catch (error) {
        console.error('Error registering user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to register user' }),
        };
    }
}

module.exports = {
    registerUser,
}
