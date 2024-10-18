const { AdminCreateUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { registerUser } = require("../../../../src/functions/user/registerUser/registerUserService");

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const sendMock = jest.fn();
  return {
    CognitoIdentityProviderClient: jest.fn(() => ({
      send: sendMock,
    })),
    AdminCreateUserCommand: jest.fn(),
    __mocks__: { sendMock },
  };
});

const { __mocks__ } = require("@aws-sdk/client-cognito-identity-provider");

describe("registerUser", () => {
    beforeEach(() => {
        __mocks__.sendMock.mockReset();
    });

    it("should register a user successfully", async () => {
        __mocks__.sendMock.mockResolvedValueOnce({});

        const result = await registerUser({
            email: "test@example.com",
            password: "password123",
        });

        expect(result).toEqual({
            statusCode: 200,
            body: JSON.stringify({ message: "User registered successfully" })
        });
        expect(AdminCreateUserCommand).toHaveBeenCalledWith({
            UserPoolId: process.env.USER_POOL_ID,
            Username: "test@example.com",
            MessageAction: "SUPPRESS",
            TemporaryPassword: "password123",
            UserAttributes: [{ Name: "email", Value: "test@example.com" }],
        });
        expect(__mocks__.sendMock).toHaveBeenCalled();
    });

    it("should throw an error if email or password is missing", async () => {
        expect(registerUser({ email: "", password: "password123" })).rejects.toThrow("Email and password are required");
        expect(registerUser({ email: "test@example.com", password: "" })).rejects.toThrow("Email and password are required");
    });
});
