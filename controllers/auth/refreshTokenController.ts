import { Response } from "express";

require("dotenv").config();
const User = require("../../models/userModal.ts");
const jwt = require("jsonwebtoken");
const handleRefreshToken = async (req: any, res: Response) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      return res.status(400).json({ message: "Cookies not found" });
    }
    console.log(cookies.refreshToken);
    const refreshToken = cookies.refreshToken;
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    const foundUser = await User.findOne(
      { refreshToken },
      { password: 0 }
    ).exec();
    // DETECTED REFRESH TOKEN REUSE, SOMEONE ELSE IS TRYING TO USE THE REFRESH TOKEN
    if (!foundUser) {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err: any, user: any) => {
          if (err) {
            return res.status(403);
          }
          const hackedUser = await User.findById(user.id);
          if (!hackedUser) {
            return res.status(403);
          }
          hackedUser.refreshToken = [];
          await hackedUser.save();
        }
      );
      return res.status(401).json({ message: "Invalid user" });
    }

    // Creating a new access token
    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt: string) => rt !== refreshToken
    );
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err: any, user: any) => {
        if (err) {
          foundUser.refreshToken = [...newRefreshTokenArray];
          await foundUser.save();
          return res.status(403).json({ message: "Invalid token" });
        }
        const accessToken = jwt.sign(
          { id: user.id },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "30m",
          }
        );
        const newRefreshToken = jwt.sign(
          { id: user.id },
          process.env.REFRESH_TOKEN_SECRET,
          {
            expiresIn: "15d",
          }
        );
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await foundUser.save();
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 15,
        });
        res.json({ accessToken, user: foundUser });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
module.exports = { handleRefreshToken };
