import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums/UserRole";

async function createUser() {
  try {
    const existingHmo = await prisma.hMO.findFirst();
    const existingPlan = await prisma.coveragePlan.findFirst();

    if (!existingHmo || !existingPlan) {
      console.log("Seed data missing. Run npx prisma db seed first.");
      return;
    }

    // Create a test user with password 'password123' (hashed)
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        password: "$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Ku", // 'password123'
        role: UserRole.PATIENT,
        firstName: "Test",
        lastName: "User",
        phoneNumber: "1234567890",
        isActive: true,
        patient: {
          create: {
            hmoId: existingHmo.id,
            membershipNumber: `MEM-${Date.now().toString().slice(-6)}`,
            coveragePlanId: existingPlan.id,
            dateOfBirth: new Date("1995-05-15"),
            gender: "Male",
            address: "123 Test Street, Lagos",
          },
        },
      },
    });
    console.log("Created test user:", user);
  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();