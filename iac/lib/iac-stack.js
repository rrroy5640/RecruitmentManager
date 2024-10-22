const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const cognito = require('aws-cdk-lib/aws-cognito');
const lambda = require('aws-cdk-lib/aws-lambda');
const iam = require('aws-cdk-lib/aws-iam');
const path = require('path');
const gateway = require('aws-cdk-lib/aws-apigateway');

class IacStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const resumeBucket = new s3.Bucket(this, 'ResumeBucket', {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: `resume-bucket-${this.account}-${this.region}`,
    });

    const candidateTable = new dynamodb.Table(this, 'CandidateTable', {
      partitionKey: { name: 'candidateId', type: dynamodb.AttributeType.STRING },
      tableName: 'CandidateTable',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const jobPostingTable = new dynamodb.Table(this, 'JobPostingTable', {
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      tableName: 'JobPostingTable',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const applicationTable = new dynamodb.Table(this, 'ApplicationTable', {
      partitionKey: { name: 'applicationId', type: dynamodb.AttributeType.STRING },
      tableName: 'ApplicationTable',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'UserPool',
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

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'UserPoolClient',
    });

    const hrGroup = new cognito.CfnUserPoolGroup(this, 'HRGroup', {
      userPoolId: userPool.userPoolId,  // Add this line
      groupName: 'HR',
      description: 'HR group',
    });

    const hiringManagerGroup = new cognito.CfnUserPoolGroup(this, 'HiringManagerGroup', {
      userPoolId: userPool.userPoolId,  // Add this line
      groupName: 'HiringManager',
      description: 'Hiring manager group',
    });

    const candidateGroup = new cognito.CfnUserPoolGroup(this, 'CandidateGroup', {
      userPoolId: userPool.userPoolId,  // Add this line
      groupName: 'Candidate',
      description: 'Candidate group',
    });

    const systemAdminGroup = new cognito.CfnUserPoolGroup(this, 'SystemAdminGroup', {
      userPoolId: userPool.userPoolId,  // Add this line
      groupName: 'SystemAdmin',
      description: 'System admin group',
    });
    const addUserToGroupPath = path.resolve(__dirname, '../../backend/src/functions/user/addUserToGroup');

    const addUserToGroupFunction = new lambda.Function(this, 'AddUserToGroupFunction', {
      functionName: 'AddUserToGroupFunction',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(addUserToGroupPath),
      handler: 'addUserToGroupHandler.handler',
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        REGION: this.region,
      },
    });

    addUserToGroupFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminAddUserToGroup'],
      resources: [userPool.userPoolArn],
    }));

    const registerUserPath = path.resolve(__dirname, '../../backend/src/functions/user/registerUser');

    const registerUserFunction = new lambda.Function(this, 'RegisterUserFunction', {
      functionName: 'RegisterUserFunction',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(registerUserPath),
      handler: 'registerUserHandler.handler',
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        REGION: this.region,
      },
    });

    registerUserFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminCreateUser'],
      resources: [userPool.userPoolArn],
    }));

    const api = new gateway.RestApi(this, 'RecruitmentManagerAPI', {
      restApiName: 'RecruitmentManagerAPI',
      description: 'API Gateway for Recruitment Manager',
    });

    const authorizer = new gateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const registerUserResource = api.root.addResource('registerUser');
    const addUserToGroupResource = api.root.addResource('addUserToGroup');

    registerUserResource.addMethod('POST', new gateway.LambdaIntegration(registerUserFunction));
    
    addUserToGroupResource.addMethod('POST', new gateway.LambdaIntegration(addUserToGroupFunction), {
      authorizer,
      authorizationType: gateway.AuthorizationType.COGNITO
    });

    // Add GSIs to the tables if needed
    candidateTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    jobPostingTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    });

    applicationTable.addGlobalSecondaryIndex({
      indexName: 'CandidateIndex',
      partitionKey: { name: 'candidateId', type: dynamodb.AttributeType.STRING },
    });

    // Add CloudWatch Logs for Lambda function
    addUserToGroupFunction.addEnvironment('LOG_LEVEL', 'INFO');
    registerUserFunction.addEnvironment('LOG_LEVEL', 'INFO');
    verifyEmailFunction.addEnvironment('LOG_LEVEL', 'INFO');
  }
}

module.exports = { IacStack }
