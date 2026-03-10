import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/admin.model';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Wipe old admins
    await Admin.deleteMany({});
    console.log('Cleared existing admins');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    const admin = new Admin({
      firstName: 'Ian',
      lastName: 'Macabulos',
      email: 'admin@accore.gov',
      passwordHash,
      department: 'Command Center',
    });

    await admin.save();
    console.log('Admin seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();