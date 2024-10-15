pipeline{
    agent any

    environment{
        AWS_CREDENTIALS = credentials('aws-credentials')
        PATH = "/usr/local/bin:${env.PATH}"
    }

    tools{
        nodejs 'NodeJS 22.9.0'
    }

    stages{
        stage('Checkout Code'){
            steps{
                checkout scm
            }
        }

        stage('Install CDK' ){
            steps{
                sh 'npm i -g aws-cdk'
            }
        }

        stage('Install Dependencies'){
            parallel{
                stage('Frontend'){
                    steps{
                        dir('frontend'){
                            sh 'npm install'
                        }
                    }
                }
                stage('Backend'){
                    steps{
                        dir('backend'){
                            sh 'npm install'
                        }
                    }
                }
                stage('Install CDK Dependencies') {
                    steps {
                        dir('iac') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }

        stage('Run Tests'){
            parallel{
                stage('Frontend'){
                    steps{
                        dir('frontend'){
                            sh 'npm test'
                        }
                    }
                }   
                stage('Backend'){
                    steps{
                        dir('backend'){
                            sh 'npm test'
                        }
                    }
                }
            }
        }   

        stage('Build and Package'){
            steps{
                dir('frontend'){
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy'){
            steps{
                script{
                    withAWS(credentials: 'aws-credentials'){
                        dir('iac'){
                            sh 'cdk deploy --require-approval never'
                        }
                    }
                }
            }
        }
    }

    post{
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs for errors.'
        }
    }   
}