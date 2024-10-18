const { ConfirmSignUpCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { verifyEmail } = require("../../../../src/functions/user/verifyEmail/verifyEmailService");

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const sendMock = jest.fn();
  return {
    CognitoIdentityProviderClient: jest.fn(() => ({
      send: sendMock,
    })),
    ConfirmSignUpCommand: jest.fn(),
    __mocks__: { sendMock },
  };
});

const { __mocks__ } = require("@aws-sdk/client-cognito-identity-provider");

describe("verifyEmail", () => {
  beforeEach(() => {
    __mocks__.sendMock.mockReset();
  });

  it("should verify email successfully", async () => {
    __mocks__.sendMock.mockResolvedValueOnce({});

    const result = await verifyEmail("test@example.com", "123456");

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ message: 'Email verified successfully' }));
    expect(__mocks__.sendMock).toHaveBeenCalledWith(
      expect.any(ConfirmSignUpCommand)
    );
  });

  it("should return an error if email or code is missing", async () => {
    const result = await verifyEmail("", "123456");

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'Email and code are required' });

    // Ensure that the mock function was not called
    expect(__mocks__.sendMock).not.toHaveBeenCalled();
  });

  it("should handle Cognito errors", async () => {
    __mocks__.sendMock.mockRejectedValueOnce(new Error("Cognito error"));

    const result = await verifyEmail("test@example.com", "123456");

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ message: 'Failed to verify email' });
    expect(__mocks__.sendMock).toHaveBeenCalledWith(
      expect.any(ConfirmSignUpCommand)
    );
  });
});
