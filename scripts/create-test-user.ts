import { prisma } from '@/lib/prisma';
import { UserRole } from '../lib/generated/prisma/UserRole';

async function createUser() {
  try {
    // Create a test user with password 'password123' (hashed)
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Ku', // 'password123' hashed
        role: UserRole.PATIENT,
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '1234567890',
        isActive: true,
        patient: {
          create: {
            // Create associated patient record
          }
        }
      },
    });
    console.log('Created user:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();