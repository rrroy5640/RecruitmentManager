const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const cognito = require('aws-cdk-lib/aws-cognito');
const lambda = require('aws-cdk-lib/aws-lambda');
const iam = require('aws-cdk-lib/aws-iam');
const path = require('path');

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
      removalPolicy: RemovalPolicy.DESTROY,
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

    const backendDistPath = path.resolve(__dirname, '../../backend/dist');

    const addUserToGroupFunction = new lambda.Function(this, 'AddUserToGroupFunction', {
      functionName: 'AddUserToGroupFunction',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(backendDistPath),
      handler: 'addUserToGroup.handler',
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        REGION: this.region,
      },
    });

    addUserToGroupFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminAddUserToGroup'],
      resources: [userPool.userPoolArn],
    }));

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

  }
}

module.exports = { IacStack }
