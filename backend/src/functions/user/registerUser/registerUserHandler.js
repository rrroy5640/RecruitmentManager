const { registerUser } = require("./registerUserService");

exports.handler = async (event) => {
  const { email, password } = event.body; 
  const response = await registerUser(email, password);
  return response;
};