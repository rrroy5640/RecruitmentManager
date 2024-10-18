const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient();

async function addUserToGroup({ email, groupName }) {
    if (!email || !groupName) {
        throw new Error('Email and groupName are required');
    }

    const params = {
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
        GroupName: groupName,
    };

    try {
        const command = new AdminAddUserToGroupCommand(params);
        await cognitoClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User added to group successfully' }),
        };
    } catch (error) {
        console.error('Error adding user to group:', error);
        throw new Error('Failed to add user to group');
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to add user to group' }),
        };
    }
}

module.exports = {
    addUserToGroup
};
