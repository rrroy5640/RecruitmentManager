const { addUserToDefaultGroup } = require("./addUserToDefaultGroupService");

exports.handler = async (event) => {
    const { email } = JSON.parse(event.body);
    try {
        const result = await addUserToDefaultGroup({ email });
        return result;
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }   
};
    