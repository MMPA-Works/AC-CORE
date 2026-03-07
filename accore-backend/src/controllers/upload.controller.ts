import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

export const uploadImage = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'accore_hazards',
        // These settings optimize the image on Cloudinary's servers
        transformation: [
          { width: 1000, crop: "limit" },
          { quality: "auto" },           
          { fetch_format: "auto" }      
        ]
      },
      (error, result) => {
        if (error) {
          res.status(500).json({ message: 'Cloudinary upload failed', error });
          return;
        }
        res.status(200).json({ secure_url: result?.secure_url });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({ message: 'Server error during upload', error });
  }
};