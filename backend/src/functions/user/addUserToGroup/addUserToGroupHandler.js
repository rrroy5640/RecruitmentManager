const { addUserToGroup } = require("./addUserToGroupService");

exports.handler = async (event) => {
  try {
    const { email, groupName } = JSON.parse(event.body);
    const user = event.requestContext.authorizer.claims;
    if (
      !user["cognito:groups"] ||
      !user["cognito:groups"].includes("SystemAdmin")
    ) {
      throw new Error("User is not authorized");
    }
    const result = await addUserToGroup({ email, groupName });
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
