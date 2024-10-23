const { CognitoIdentityProviderClient, UpdateUserPoolCommand } = require("@aws-sdk/client-cognito-identity-provider");

exports.handler = async (event) => {
  const client = new CognitoIdentityProviderClient();
  const userPoolId = event.ResourceProperties.UserPoolId;
  const lambdaArn = event.ResourceProperties.LambdaArn;

  try {
    if (event.RequestType === "Create" || event.RequestType === "Update") {
      const command = new UpdateUserPoolCommand({
        UserPoolId: userPoolId,
        LambdaConfig: {
          PostConfirmation: lambdaArn,
        },
      });
      await client.send(command);
      return {
        Status: "SUCCESS",
      };
    } else if (event.RequestType === "Delete") {
      const command = new UpdateUserPoolCommand({
        UserPoolId: userPoolId,
        LambdaConfig: {}, // 删除 Lambda 配置
      });
      await client.send(command);
      return {
        Status: "SUCCESS",
      };
    }
  } catch (error) {
    console.error("Failed to update User Pool:", error);
    return {
      Status: "FAILED",
      Reason: error.message,
    };
  }
};
