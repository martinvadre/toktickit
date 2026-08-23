import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  // 3. Seed Development Requesters (4 active, 1 inactive)
  const requesters = [
    {
      id: 1,
      name: "Somchai Prasert",
      email: "somchai.pra@kmutt.ac.th",
      department: "Computer Engineering",
      isActive: true,
    },
    {
      id: 2,
      name: "Apinya Sukcharoen",
      email: "apinya.suk@kmutt.ac.th",
      department: "Information Technology",
      isActive: true,
    },
    {
      id: 3,
      name: "Kittisak Rattana",
      email: "kittisak.rat@kmutt.ac.th",
      department: "Electrical Engineering",
      isActive: true,
    },
    {
      id: 4,
      name: "Nattaporn Chaidee",
      email: "nattaporn.cha@kmutt.ac.th",
      department: "Mechanical Engineering",
      isActive: true,
    },
    {
      id: 5,
      name: "Wandee InactiveUser",
      email: "wandee.old@kmutt.ac.th",
      department: "Former Staff",
      isActive: false,
    },
  ];

  for (const requester of requesters) {
    const result = await prisma.requesterUser.upsert({
      where: { id: requester.id },
      update: {
        name: requester.name,
        email: requester.email,
        department: requester.department,
        isActive: requester.isActive,
      },
      create: requester,
    });
    console.log(
      `Seeded development requester: ${result.name} (ID: ${result.id}, active: ${result.isActive})`
    );
  }
  console.log(`Successfully seeded ${requesters.length} development requesters.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
