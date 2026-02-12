const crypto = require("crypto");

const generateActivationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateTempPassword = () => {
  return crypto.randomBytes(4).toString("hex"); // 8 characters
};

module.exports = {
  generateActivationToken,
  generateResetToken,
  generateTempPassword,
};
