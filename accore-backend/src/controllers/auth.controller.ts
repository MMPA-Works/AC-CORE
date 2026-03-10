import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model";

export const loginAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Compare the submitted password with the scrambled password in the database
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Create a secure token that includes the admin's name
    const token = jwt.sign(
      {
        id: admin._id,
        firstName: admin.firstName, 
        lastName: admin.lastName,   
        department: admin.department,
        role: "admin",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    res.status(200).json({ token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error });
  }
};