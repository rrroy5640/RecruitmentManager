const {
  Stack,
  RemovalPolicy,
  CfnOutput,
  Token,
  CustomResource,
} = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const cognito = require("aws-cdk-lib/aws-cognito");
const lambda = require("aws-cdk-lib/aws-lambda");
const iam = require("aws-cdk-lib/aws-iam");
const path = require("path");
const gateway = require("aws-cdk-lib/aws-apigateway");
const cr = require("aws-cdk-lib/custom-resources");

class IacStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const resumeBucket = new s3.Bucket(this, "ResumeBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: `resume-bucket-${this.account}-${this.region}`,
    });

    const candidateTable = new dynamodb.Table(this, "CandidateTable", {
      partitionKey: {
        name: "candidateId",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "CandidateTable",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const jobPostingTable = new dynamodb.Table(this, "JobPostingTable", {
      partitionKey: { name: "jobId", type: dynamodb.AttributeType.STRING },
      tableName: "JobPostingTable",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const applicationTable = new dynamodb.Table(this, "ApplicationTable", {
      partitionKey: {
        name: "applicationId",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "ApplicationTable",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "UserPool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      removalPolicy: RemovalPolicy.DESTROY,
      passwordPolicy: {
        minimumLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: true,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      userPoolClientName: "UserPoolClient",
    });

    // Create User Pool Groups
    const groups = ["HR", "HiringManager", "Candidate", "SystemAdmin"];
    const userPoolGroups = groups.map(
      (groupName) =>
        new cognito.CfnUserPoolGroup(this, `${groupName}Group`, {
          userPoolId: userPool.userPoolId,
          groupName: groupName,
          description: `${groupName} group`,
        })
    );

    const addUserToGroupPath = path.resolve(
      __dirname,
      "../../backend/src/functions/user/addUserToGroup"
    );

    const addUserToGroupFunction = new lambda.Function(
      this,
      "AddUserToGroupFunction",
      {
        functionName: "AddUserToGroupFunction",
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(addUserToGroupPath),
        handler: "addUserToGroupHandler.handler",
        environment: {
          USER_POOL_ID: userPool.userPoolId,
          REGION: this.region,
        },
      }
    );

    const registerUserPath = path.resolve(
      __dirname,
      "../../backend/src/functions/user/registerUser"
    );

    const registerUserFunction = new lambda.Function(
      this,
      "RegisterUserFunction",
      {
        functionName: "RegisterUserFunction",
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(registerUserPath),
        handler: "registerUserHandler.handler",
        environment: {
          USER_POOL_ID: userPool.userPoolId,
          REGION: this.region,
        },
      }
    );

    const addUserToDefaultGroupPath = path.resolve(
      __dirname,
      "../../backend/src/functions/user/addUserToDefaultGroup"
    );

    const addUserToDefaultGroupFunction = new lambda.Function(
      this,
      "AddUserToDefaultGroupFunction",
      {
        functionName: "AddUserToDefaultGroupFunction",
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(addUserToDefaultGroupPath),
        handler: "addUserToDefaultGroupHandler.handler",
        environment: {
          REGION: this.region,
        },
      }
    );

    // Create API Gateway
    const api = new gateway.RestApi(this, "RecruitmentManagerAPI", {
      restApiName: "RecruitmentManagerAPI",
      description: "API Gateway for Recruitment Manager",
    });

    // Create resources and methods
    const registerUserResource = api.root.addResource("registerUser");
    const addUserToGroupResource = api.root.addResource("addUserToGroup");

    registerUserResource.addMethod(
      "POST",
      new gateway.LambdaIntegration(registerUserFunction)
    );

    // Create Cognito Authorizer
    const authorizer = new gateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    // Apply authorizer to addUserToGroup method
    addUserToGroupResource.addMethod(
      "POST",
      new gateway.LambdaIntegration(addUserToGroupFunction),
      {
        authorizer,
        authorizationType: gateway.AuthorizationType.COGNITO,
      }
    );

    addUserToGroupFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminAddUserToGroup"],
        resources: [userPool.userPoolArn],
      })
    );

    registerUserFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminCreateUser"],
        resources: [userPool.userPoolArn],
      })
    );

    addUserToDefaultGroupFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminAddUserToGroup"],
        resources: [userPool.userPoolArn],
      })
    );

    // Custom resource to add trigger after all resources are created
    const provider = new cr.Provider(this, "PostConfirmationTriggerProvider", {
      onEventHandler: new lambda.Function(this, "TriggerHandler", {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../backend/src/functions/customResource")
        ),
        handler: "triggerHandler.handler",
        initialPolicy: [
          new iam.PolicyStatement({
            actions: ["cognito-idp:UpdateUserPool"],
            resources: [userPool.userPoolArn],
          }),
        ],
      }),
    });

    const customResource = new CustomResource(this, "CustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        UserPoolId: userPool.userPoolId,
        LambdaArn: addUserToDefaultGroupFunction.functionArn,
      },
    });

    customResource.node.addDependency(userPool);
    customResource.node.addDependency(addUserToDefaultGroupFunction);

    // Output the User Pool ID and Client ID
    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    // Add GSIs to the tables if needed
    candidateTable.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
    });

    jobPostingTable.addGlobalSecondaryIndex({
      indexName: "StatusIndex",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
    });

    applicationTable.addGlobalSecondaryIndex({
      indexName: "CandidateIndex",
      partitionKey: {
        name: "candidateId",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Add CloudWatch Logs for Lambda function
    addUserToGroupFunction.addEnvironment("LOG_LEVEL", "INFO");
    registerUserFunction.addEnvironment("LOG_LEVEL", "INFO");
  }
}

module.exports = { IacStack };
