const { addUserToGroup } = require("./addUserToGroupService");

exports.handler = async (event) => {
  try {
    const { email, groupName } = JSON.parse(event.body);
    const result = await addUserToGroup({ email, groupName });
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error adding user to group:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
