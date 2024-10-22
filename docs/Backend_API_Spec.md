# Recruitment Manager API Specification

## User Management Module

### 1. User Registration
- **Path**: `/registerUser`
- **Request Method**: `POST`
- **Description**: Register a new user and add them to the Cognito user pool.
- **Request Parameters**:
  - `email`: User's email (String, required)
  - `password`: User's password (String, required)
  - `group`: User's group, e.g., `HR`, `HiringManager`, `Candidate`, etc. (String, required)
- **Response**:
  - Success: `201 Created`
  - Failure: `400 Bad Request` or `500 Internal Server Error`

### 2. Email Verification
- **Path**: `/verifyEmail`
- **Request Method**: `POST`
- **Description**: Verify user's email to complete the registration process.
- **Request Parameters**:
  - `email`: User's email (String, required)
  - `verificationCode`: Verification code received by the user (String, required)
- **Response**:
  - Success: `200 OK`
  - Failure: `400 Bad Request` or `500 Internal Server Error`

### 3. User Login
- **Path**: `/login`
- **Request Method**: `POST`
- **Description**: Perform user login and obtain authentication token.
- **Request Parameters**:
  - `email`: User's email (String, required)
  - `password`: User's password (String, required)
- **Response**:
  - Success: `200 OK`, includes authentication token
  - Failure: `401 Unauthorized` or `500 Internal Server Error`

### 4. Get User Details
- **Path**: `/getUserDetails`
- **Request Method**: `GET`
- **Description**: Get detailed information of the currently logged-in user.
- **Authentication**: Requires Cognito authorization
- **Request Parameters**:
  - None
- **Response**:
  - Success: `200 OK`, includes user details
  - Failure: `401 Unauthorized` or `500 Internal Server Error`

## Job Management Module

### 1. Create Job Posting
- **Path**: `/createJobPosting`
- **Request Method**: `POST`
- **Description**: Create a new job posting.
- **Authentication**: Requires `HiringManager` or `SystemAdmin` role
- **Request Parameters**:
  - `jobTitle`: Job title (String, required)
  - `description`: Job description (String, required)
  - `requirements`: Job requirements (Array, required)
  - `location`: Work location (String, optional)
- **Response**:
  - Success: `201 Created`
  - Failure: `400 Bad Request` or `500 Internal Server Error`

### 2. Get Job Listings
- **Path**: `/listJobPostings`
- **Request Method**: `GET`
- **Description**: Get a list of all open job positions.
- **Request Parameters**:
  - `status`: Job status (String, optional, `open` or `closed`)
- **Response**:
  - Success: `200 OK`, includes job list
  - Failure: `500 Internal Server Error`

## Application Management Module

### 1. Submit Job Application
- **Path**: `/submitApplication`
- **Request Method**: `POST`
- **Description**: Submit a user's application for a job.
- **Authentication**: Requires `Candidate` role
- **Request Parameters**:
  - `jobId`: ID of the job being applied for (String, required)
  - `resume`: S3 URL of the resume file (String, required)
- **Response**:
  - Success: `201 Created`
  - Failure: `400 Bad Request` or `500 Internal Server Error`

### 2. Check Application Status
- **Path**: `/getApplicationStatus`
- **Request Method**: `GET`
- **Description**: Get the status of a user's submitted job application.
- **Authentication**: Requires Cognito authorization
- **Request Parameters**:
  - `applicationId`: ID of the application (String, required)
- **Response**:
  - Success: `200 OK`, includes application status
  - Failure: `400 Bad Request` or `500 Internal Server Error`

## Management Functions Module

### 1. Add User to Specific Group
- **Path**: `/addUserToGroup`
- **Request Method**: `POST`
- **Description**: Add a specified user to a specific group.
- **Authentication**: Requires `SystemAdmin` role
- **Request Parameters**:
  - `email`: User's email (String, required)
  - `groupName`: Name of the group to add (String, required)
- **Response**:
  - Success: `200 OK`
  - Failure: `400 Bad Request` or `500 Internal Server Error`
