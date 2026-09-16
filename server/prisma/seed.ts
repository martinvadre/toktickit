import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Seed Categories (4 required categories)
  const categories = [
    { id: 1, name: "Account and Access", isActive: true },
    { id: 2, name: "Hardware", isActive: true },
    { id: 3, name: "Software", isActive: true },
    { id: 4, name: "Network", isActive: true },
  ];

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name, isActive: category.isActive },
      create: category,
    });
    console.log(`Seeded request category: ${result.name} (ID: ${result.id})`);
  }
  console.log(`Successfully seeded ${categories.length} request categories.`);

  // 2. Seed Related Systems (7 systems)
  const relatedSystems = [
    { id: 1, name: "Email System", isActive: true },
    { id: 2, name: "Campus Wi-Fi", isActive: true },
    { id: 3, name: "VPN Access", isActive: true },
    { id: 4, name: "LEB2 Learning Platform", isActive: true },
    { id: 5, name: "Grade Submission Portal", isActive: true },
    { id: 6, name: "Network Printer", isActive: true },
    { id: 7, name: "Corporate Laptop", isActive: true },
  ];

  for (const system of relatedSystems) {
    const result = await prisma.relatedSystem.upsert({
      where: { id: system.id },
      update: { name: system.name, isActive: system.isActive },
      create: system,
    });
    console.log(`Seeded related system: ${result.name} (ID: ${result.id})`);
  }
  console.log(`Successfully seeded ${relatedSystems.length} related systems.`);

  // 3. Seed Users (Sprint 3: Requesters, IT Staff, Administrators, and first-login temp user)
  const users = [
    // Requesters (>= 4 active, 1 inactive)
    {
      id: 1,
      name: "Somchai Prasert",
      email: "somchai.pra@kmutt.ac.th",
      department: "Computer Engineering",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 2,
      name: "Apinya Sukcharoen",
      email: "apinya.suk@kmutt.ac.th",
      department: "Information Technology",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 3,
      name: "Kittisak Rattana",
      email: "kittisak.rat@kmutt.ac.th",
      department: "Electrical Engineering",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 4,
      name: "Nattaporn Chaidee",
      email: "nattaporn.cha@kmutt.ac.th",
      department: "Mechanical Engineering",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 5,
      name: "Wandee InactiveUser",
      email: "wandee.old@kmutt.ac.th",
      department: "Former Staff",
      role: Role.REQUESTER,
      isActive: false,
      mustChangePassword: false,
    },
    // IT Staff (>= 3 active, 1 inactive)
    {
      id: 6,
      name: "Supachai Techavichit",
      email: "staff.supachai@kmutt.ac.th",
      department: "IT Operations",
      role: Role.STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 7,
      name: "Manee Kerdphon",
      email: "staff.manee@kmutt.ac.th",
      department: "IT Helpdesk",
      role: Role.STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 8,
      name: "Chayanon Siriporn",
      email: "staff.chayanon@kmutt.ac.th",
      department: "Network Operations",
      role: Role.STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 9,
      name: "Niran InactiveStaff",
      email: "staff.inactive@kmutt.ac.th",
      department: "Former IT Staff",
      role: Role.STAFF,
      isActive: false,
      mustChangePassword: false,
    },
    // Administrator (>= 1 active)
    {
      id: 10,
      name: "Admin System",
      email: "admin@kmutt.ac.th",
      department: "IT Governance",
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
    // First-Login Password Change Test User
    {
      id: 11,
      name: "First Login User",
      email: "firstlogin@kmutt.ac.th",
      department: "Academic Affairs",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: true,
    },
  ];

  for (const user of users) {
    const result = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        passwordHash: defaultPasswordHash,
        department: user.department,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: defaultPasswordHash,
        department: user.department,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      },
    });

    // Also keep RequesterUser synchronized for Lab 2 development requester fallback
    if (user.role === Role.REQUESTER) {
      await prisma.requesterUser.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          department: user.department,
          isActive: user.isActive,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          isActive: user.isActive,
        },
      });
    }

    console.log(
      `Seeded user: ${result.name} (${result.email}) [Role: ${result.role}, active: ${result.isActive}, mustChangePassword: ${result.mustChangePassword}]`
    );
  }
  console.log(`Successfully seeded ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
