const {
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { addUserToDefaultGroup } = require("../../../../src/functions/user/addUserToDefaultGroup/addUserToDefaultGroupService");

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const sendMock = jest.fn();
  return {
    CognitoIdentityProviderClient: jest.fn(() => ({
      send: sendMock,
    })),
    AdminAddUserToGroupCommand: jest.fn(),
    __mocks__: { sendMock },
  };
});

const { __mocks__ } = require("@aws-sdk/client-cognito-identity-provider");

describe("addUserToDefaultGroup", () => {
  beforeEach(() => {
    __mocks__.sendMock.mockReset();
  });

  it("should add user to default group successfully", async () => {
    __mocks__.sendMock.mockResolvedValueOnce({});

    const result = await addUserToDefaultGroup({
      email: "test@example.com",
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ message: 'User added to group successfully' }));
    expect(__mocks__.sendMock).toHaveBeenCalledWith(
      expect.any(AdminAddUserToGroupCommand)
    );
  });

  it("should throw an error if adding user to group fails", async () => {
    __mocks__.sendMock.mockRejectedValueOnce(new Error("Failed to add user to group"));
    await expect(addUserToDefaultGroup({ email: "test@example.com" })).rejects.toThrow("Failed to add user to group");
  });

  it("should return a 400 error if email is not provided", async () => {
    const result = await addUserToDefaultGroup({});
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ message: 'Email is required' }));
  });
});
