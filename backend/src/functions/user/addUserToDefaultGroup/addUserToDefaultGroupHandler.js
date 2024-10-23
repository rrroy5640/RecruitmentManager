const { addUserToDefaultGroup } = require("./addUserToDefaultGroupService");

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const userPoolId = event.ResourceProperties.UserPoolId;
    const email = event.RequestType === 'Create' ? event.Request.userAttributes.email : event.Request.userName;

    try {
        const result = await addUserToDefaultGroup({ email, userPoolId });

        return event;
    } catch (error) {
        console.error('Error adding user to default group:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
