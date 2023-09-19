import { NextFunction, Request, Response } from "express";

require("dotenv").config();
const jwt = require("jsonwebtoken");
const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    console.log(token);
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      (err: any, user: any) => {
        if (err) {
          return res.status(403).json({ message: "Invalid token" });
        }
        console.log(user);
        // @ts-ignore
        req.user = user.id;
        next();
      }
    );
  } catch (error) {
    console.log(error);
  }
};
export { verifyJWT };
