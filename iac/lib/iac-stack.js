const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const cognito = require('aws-cdk-lib/aws-cognito');

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

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'IacQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });
  }
}

module.exports = { IacStack }