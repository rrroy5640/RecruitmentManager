const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const {
  addUserToGroup,
} = require("../../../../src/functions/user/addUserToGroup/addUserToGroupService");

// Mock the AWS SDK v3
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

describe("addUserToGroup", () => {
  beforeEach(() => {
    __mocks__.sendMock.mockReset();
  });

  it("should add user to group successfully", async () => {
    __mocks__.sendMock.mockResolvedValueOnce({});

    const result = await addUserToGroup({
      email: "test@example.com",
      groupName: "Recruiters",
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ message: 'User added to group successfully' }));
    expect(__mocks__.sendMock).toHaveBeenCalledWith(
      expect.any(AdminAddUserToGroupCommand)
    );
  });

  it("should throw an error if email or groupName is missing", async () => {
    await expect(
      addUserToGroup({ email: "", groupName: "Recruiters" })
    ).rejects.toThrow("Email and groupName are required");
  });

  it("should throw an error if adding user to group fails", async () => {
    __mocks__.sendMock.mockRejectedValueOnce(
      new Error("Failed to add user to group")
    );

    await expect(
      addUserToGroup({ email: "test@example.com", groupName: "Recruiters" })
    ).rejects.toThrow("Failed to add user to group");
  });
});
