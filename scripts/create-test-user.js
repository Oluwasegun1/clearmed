const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    // 1. Create HMO
    const hmo = await prisma.hMO.create({
      data: {
        name: 'Default HMO',
        address: '123 HMO Street',
        city: 'HMO City',
        state: 'HMO State',
        phoneNumber: '1234567890',
        email: 'contact@defaulthmo.com',
        licenseNumber: 'HMO12345',
        isActive: true
      }
    });
    console.log('Created HMO:', hmo);

    // 2. Create Coverage Plan
    const coveragePlan = await prisma.coveragePlan.create({
      data: {
        name: 'Basic Coverage',
        description: 'Basic healthcare coverage',
        hmoId: hmo.id
      }
    });
    console.log('Created Coverage Plan:', coveragePlan);

    // 3. Create User with Patient record
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Ku', // 'password123' hashed
        role: 'PATIENT',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '1234567890',
        isActive: true
      }
    });
    console.log('Created User:', user);

    // 4. Create Patient record
    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        hmoId: hmo.id,
        membershipNumber: 'TEST12345',
        coveragePlanId: coveragePlan.id,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male'
      }
    });
    console.log('Created Patient:', patient);

    console.log('\nLogin credentials:\nEmail: test@example.com\nPassword: password123');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();