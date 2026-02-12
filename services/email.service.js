const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send activation email
const sendActivationEmail = async (user, activationToken) => {
  try {
    const transporter = createTransporter();

    const activationUrl = `${process.env.FRONTEND_URL}/activate-account?token=${activationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Activate Your DELPRO LABS Account",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Welcome to DELPRO LABS!</h2>
          <p>Hi ${user.name},</p>
          <p>Thank you for registering with DELPRO LABS. Please click the button below to activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Activate Account
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${activationUrl}</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Activation email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending activation email:", error);
    throw new Error("Failed to send activation email");
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Reset Your DELPRO LABS Password",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send staff credentials email
const sendStaffCredentialsEmail = async (user, tempPassword) => {
  try {
    console.log(
      "Sending staff credentials email to:",
      user?.email,
      "User:",
      user,
    );

    if (!user || !user.email) {
      throw new Error("User or user email is missing");
    }

    const transporter = createTransporter();

    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Your DELPRO LABS Staff Account Credentials",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Welcome to DELPRO LABS Team!</h2>
          <p>Hi ${user.name},</p>
          <p>Your staff account has been created. Here are your login credentials:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
          </div>
          <p>Please login with your credentials:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
        
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you have any questions, please contact your administrator.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Staff credentials email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending staff credentials email:", error);
    throw new Error("Failed to send staff credentials email");
  }
};

module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail,
  sendStaffCredentialsEmail,
};
