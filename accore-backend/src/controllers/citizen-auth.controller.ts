import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Citizen from '../models/citizen.model';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    // Verify token with Google servers
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: 'Invalid Google token payload' });
      return;
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Find existing citizen or create a new one
    let citizen = await Citizen.findOne({ googleId });

    if (!citizen) {
      citizen = await Citizen.create({
        googleId,
        email,
        firstName: given_name,
        lastName: family_name,
        profilePicture: picture,
      });
    }

    // Generate custom JWT for AC-CORE session
    const jwtToken = jwt.sign(
      { id: citizen._id, role: 'citizen' },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Authentication successful',
      token: jwtToken,
      citizen: {
        id: citizen._id,
        email: citizen.email,
        firstName: citizen.firstName,
        lastName: citizen.lastName,
        profilePicture: citizen.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during Google authentication' });
  }
};

export const registerCitizen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingCitizen = await Citizen.findOne({ email });
    if (existingCitizen) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCitizen = await Citizen.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    // Generate custom JWT so the user is authenticated automatically
    const jwtToken = jwt.sign(
      { id: newCitizen._id, role: 'citizen' },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token: jwtToken,
      citizen: {
        id: newCitizen._id,
        email: newCitizen.email,
        firstName: newCitizen.firstName,
        lastName: newCitizen.lastName,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const loginCitizen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const citizen = await Citizen.findOne({ email });
    if (!citizen || !citizen.password) {
      res.status(401).json({ message: 'Invalid credentials or please login with Google' });
      return;
    }

    const isMatch = await bcrypt.compare(password, citizen.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const jwtToken = jwt.sign(
      { id: citizen._id, role: 'citizen' },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token: jwtToken,
      citizen: {
        id: citizen._id,
        email: citizen.email,
        firstName: citizen.firstName,
        lastName: citizen.lastName,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};