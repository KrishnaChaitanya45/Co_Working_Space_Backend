import { SentMessageInfo } from "nodemailer";
const bcrypt = require("bcryptjs");
require("dotenv").config();
const nodemailer = require("nodemailer");
const UserOTPVerification = require("../models/userOTPVerification.ts");
const sendOTPVerificationEmail = async (
  email: string,
  user_id: string,
  user_name: string,
  body: { message: string; subject: string },
  usernameOrEmail: string
) => {
  try {
    const otp = `${1000 + Math.floor(Math.random() * 9000)}`;
    const testAccount = await nodemailer.createTestAccount();
    const config = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    };
    const transporter = nodemailer.createTransport(config);
    const message = {
      from: "Co Working Space", // sender address
      to: email, // list of receivers
      subject: body
        ? body.subject
        : `Welcome to Co Working Space, ${user_name}`, // Subject line
      text: body ? body.message : `Here is your otp for verification `, // plain text body
      html: `<b>${otp}</b>
      <br/>
      <b>OTP will expire in 1 hour</b>

      `, // html body
    };
    const response = transporter.sendMail(
      message,
      async (err: any, info: SentMessageInfo) => {
        if (err) {
          console.log("Error occurred. " + err.message);
          return process.exit(1);
        }
        console.log("Message sent: %s", info.messageId);
        console.log("Node Mailer Response", nodemailer.getTestMessageUrl(info));
        const hashedOTP = await bcrypt.hash(otp, 10);
        if (!usernameOrEmail) {
          const UserOTP = await UserOTPVerification.create({
            user: user_id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
          });
          await UserOTP.save();
        } else {
          const UserOTP = await UserOTPVerification.create({
            user: usernameOrEmail,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
          });
          await UserOTP.save();
        }
      }
    );
  } catch (error) {
    console.log("MAIL SENDING FAILED", error);
  }
};

module.exports = sendOTPVerificationEmail;
export {};
