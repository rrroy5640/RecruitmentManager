const { addUserToDefaultGroup } = require("./addUserToDefaultGroupService");

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const email = event.request.userAttributes.email;

    try {
        const result = await addUserToDefaultGroup({ email });

        return event;
    } catch (error) {
        console.error('Error adding user to default group:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
