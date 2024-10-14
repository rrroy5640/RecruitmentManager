const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient();

exports.addUserToGroup = async ({ email, groupName }) => {
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
            status: 'success',
            message: 'User added to group successfully',
        };
    } catch (error) {
        console.error('Error adding user to group:', error);
        throw new Error('Failed to add user to group');
    }
};