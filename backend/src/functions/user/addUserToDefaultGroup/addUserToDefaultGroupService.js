const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient();

async function addUserToDefaultGroup({ email }) {
    if (!email) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Email is required' }),
        };
    }

    const params = {
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
        GroupName: "Candidates",
    };

    try {
        const command = new AdminAddUserToGroupCommand(params);
        await cognitoClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User added to group successfully' }),
        };
    } catch (error) {
        throw new Error('Failed to add user to group');
    }
}

module.exports = { addUserToDefaultGroup };
