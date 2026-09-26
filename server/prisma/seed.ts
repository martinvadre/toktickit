import { PrismaClient, Role, Priority, TicketStatus, ActionStatus } from "@prisma/client";
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

  // 3. Seed Users (Requesters, IT Staff, Administrators, and first-login temp user)
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
      `Seeded user: ${result.name} (${result.email}) [Role: ${result.role}, active: ${result.isActive}]`
    );
  }
  console.log(`Successfully seeded ${users.length} users.`);

  // 4. Seed Realistic Tickets covering all statuses and multiple Actions Taken
  const seedTickets = [
    {
      id: 1,
      ticketNumber: "TCK-20260901-0001",
      requesterId: 1,
      assignedStaffId: 6,
      categoryId: 2,
      relatedSystemId: 7,
      summary: "Corporate laptop battery overheating and draining rapidly",
      description: "Battery drains from 100% to 10% in under 30 minutes while running standard office apps.",
      requestedPriority: Priority.HIGH,
      itPriority: Priority.HIGH,
      currentStatus: TicketStatus.IN_PROGRESS,
      resolutionSummary: null,
      requesterIndicatedResolved: false,
      actions: [
        {
          id: 1,
          actionDateTime: new Date("2026-09-02T10:00:00Z"),
          actionDescription: "Ran hardware diagnostic tests on battery cells.",
          result: "Cell 3 reported high internal impedance (failing).",
          performedById: 6, // Supachai
          status: ActionStatus.COMPLETED,
          followUpRequired: true,
          followUpNote: "Ordered replacement battery pack model BTY-X1.",
          attachmentNotes: "diag_battery_01.log",
        },
        {
          id: 2,
          actionDateTime: new Date("2026-09-04T14:30:00Z"),
          actionDescription: "Received replacement battery and swapped into chassis.",
          result: "Chassis reassembled and power delivery verified normal.",
          performedById: 7, // Manee (BR-02: different staff member than primary owner)
          status: ActionStatus.COMPLETED,
          followUpRequired: true,
          followUpNote: "Conduct full charge-discharge cycle test before returning to user.",
          attachmentNotes: null,
        },
        {
          id: 3,
          actionDateTime: new Date("2026-09-05T09:00:00Z"),
          actionDescription: "Monitored 4-hour stress test and thermals.",
          result: "Battery operated within normal thermal threshold; runtime > 6 hours.",
          performedById: 8, // Chayanon (BR-02: third staff member)
          status: ActionStatus.COMPLETED,
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: "thermal_chart.png",
        },
      ],
    },
    {
      id: 2,
      ticketNumber: "TCK-20260902-0002",
      requesterId: 1,
      assignedStaffId: null, // Unassigned!
      categoryId: 4,
      relatedSystemId: 3,
      summary: "Cannot connect to campus VPN from off-campus network",
      description: "Error 809: The network connection between your computer and the VPN server could not be established.",
      requestedPriority: Priority.URGENT,
      itPriority: Priority.URGENT,
      currentStatus: TicketStatus.NEW,
      resolutionSummary: null,
      requesterIndicatedResolved: false,
      actions: [], // 0 actions taken
    },
    {
      id: 3,
      ticketNumber: "TCK-20260905-0003",
      requesterId: 1,
      assignedStaffId: 7,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Mailbox quota exceeded warning preventing sent messages",
      description: "Unable to send outgoing emails due to mailbox size limit warning.",
      requestedPriority: Priority.MEDIUM,
      itPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
      resolutionSummary: null,
      requesterIndicatedResolved: false,
      actions: [
        {
          id: 4,
          actionDateTime: new Date("2026-09-06T11:00:00Z"),
          actionDescription: "Archived mailbox items older than 2 years to secondary cold storage.",
          result: "Freed up 8.5 GB of quota.",
          performedById: 7,
          status: ActionStatus.COMPLETED,
          followUpRequired: true,
          followUpNote: "Waiting for user to verify that Outlook displays archive folder correctly.",
          attachmentNotes: null,
        },
      ],
    },
    {
      id: 4,
      ticketNumber: "TCK-20260908-0004",
      requesterId: 1,
      assignedStaffId: 6,
      categoryId: 3,
      relatedSystemId: 4,
      summary: "Gradebook calculation formula discrepancy in Section 2",
      description: "Weighted averages for homework assignments showing negative values for some students.",
      requestedPriority: Priority.HIGH,
      itPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.RESOLVED,
      resolutionSummary: "Identified inverted weighting coefficient in gradebook configuration matrix and corrected to 0.15.",
      requesterIndicatedResolved: true,
      resolvedAt: new Date("2026-09-10T16:00:00Z"),
      actions: [
        {
          id: 5,
          actionDateTime: new Date("2026-09-09T13:00:00Z"),
          actionDescription: "Inspected LEB2 formula definition and calculation logs.",
          result: "Found syntax error in weighted sum script.",
          performedById: 6,
          status: ActionStatus.COMPLETED,
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: "formula_diff.txt",
        },
        {
          id: 6,
          actionDateTime: new Date("2026-09-10T15:30:00Z"),
          actionDescription: "Applied patch to grade calculation engine and recomputed class roster grades.",
          result: "All grades now calculate accurately.",
          performedById: 6,
          status: ActionStatus.COMPLETED,
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: "grade_verification.csv",
        },
      ],
    },
    {
      id: 5,
      ticketNumber: "TCK-20260910-0005",
      requesterId: 1,
      assignedStaffId: 6,
      categoryId: 2,
      relatedSystemId: 6,
      summary: "Department network printer tray 2 jam sensor false alarm",
      description: "Printer continually prompts Paper Jam in Tray 2 even after clearing paper.",
      requestedPriority: Priority.LOW,
      itPriority: Priority.LOW,
      currentStatus: TicketStatus.CLOSED,
      resolutionSummary: "Cleaned optical sensor in paper tray 2 assembly and recalibrated sensor threshold.",
      requesterIndicatedResolved: true,
      resolvedAt: new Date("2026-09-11T11:00:00Z"),
      closedAt: new Date("2026-09-12T09:00:00Z"),
      actions: [
        {
          id: 7,
          actionDateTime: new Date("2026-09-11T10:00:00Z"),
          actionDescription: "Cleaned optical sensor in paper tray 2 assembly.",
          result: "Sensor calibrated and zero false paper jams during 50-sheet test print.",
          performedById: 6,
          status: ActionStatus.COMPLETED,
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      id: 6,
      ticketNumber: "TCK-20260912-0006",
      requesterId: 2,
      assignedStaffId: 8,
      categoryId: 4,
      relatedSystemId: 2,
      summary: "Intermittent Wi-Fi drops in Building 3 lecture hall",
      description: "Students frequently lose connection during afternoon seminars.",
      requestedPriority: Priority.MEDIUM,
      itPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.OPEN,
      resolutionSummary: null,
      requesterIndicatedResolved: false,
      actions: [
        {
          id: 8,
          actionDateTime: new Date("2026-09-13T10:00:00Z"),
          actionDescription: "Conducted RF signal analysis and channel saturation scan.",
          result: "Detected co-channel interference on 2.4GHz channels 1 and 6.",
          performedById: 8,
          status: ActionStatus.IN_PROGRESS,
          followUpRequired: true,
          followUpNote: "Plan access point channel reassignment and power tuning.",
          attachmentNotes: "wifi_survey_bldg3.png",
        },
      ],
    },
    {
      id: 7,
      ticketNumber: "TCK-20260915-0007",
      requesterId: 3,
      assignedStaffId: null, // Unassigned!
      categoryId: 1,
      relatedSystemId: 5,
      summary: "Faculty account permissions missing for semester 1/2026 courses",
      description: "Cannot view assigned lecture courses in grade submission portal dropdown.",
      requestedPriority: Priority.HIGH,
      itPriority: null,
      currentStatus: TicketStatus.NEW,
      resolutionSummary: null,
      requesterIndicatedResolved: false,
      actions: [], // 0 actions
    },
    {
      id: 8,
      ticketNumber: "TCK-20260916-0008",
      requesterId: 4,
      assignedStaffId: 6,
      categoryId: 3,
      relatedSystemId: 7,
      summary: "CAD modeling software crashes immediately upon launch",
      description: "Issue recurred after latest graphics driver update.",
      requestedPriority: Priority.MEDIUM,
      itPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.REOPENED,
      resolutionSummary: null,
      requesterIndicatedResolved: false,
      actions: [
        {
          id: 9,
          actionDateTime: new Date("2026-09-16T15:00:00Z"),
          actionDescription: "Examined crash dumps in Event Viewer.",
          result: "Exception in nvoglv64.dll (OpenGL driver crash).",
          performedById: 6,
          status: ActionStatus.PENDING,
          followUpRequired: true,
          followUpNote: "Roll back NVIDIA driver to certified enterprise release.",
          attachmentNotes: "crash_dump.dmp",
        },
      ],
    },
  ];

  for (const t of seedTickets) {
    const { actions, ...ticketData } = t;
    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: ticketData.ticketNumber },
      update: ticketData,
      create: ticketData,
    });

    for (const a of actions) {
      await prisma.actionTaken.upsert({
        where: { id: a.id },
        update: {
          ticketId: ticket.id,
          actionDateTime: a.actionDateTime,
          actionDescription: a.actionDescription,
          result: a.result,
          performedById: a.performedById,
          status: a.status,
          followUpRequired: a.followUpRequired,
          followUpNote: a.followUpNote,
          attachmentNotes: a.attachmentNotes,
        },
        create: {
          id: a.id,
          ticketId: ticket.id,
          actionDateTime: a.actionDateTime,
          actionDescription: a.actionDescription,
          result: a.result,
          performedById: a.performedById,
          status: a.status,
          followUpRequired: a.followUpRequired,
          followUpNote: a.followUpNote,
          attachmentNotes: a.attachmentNotes,
        },
      });
    }

    console.log(
      `Seeded ticket: ${ticket.ticketNumber} [Status: ${ticket.currentStatus}, Priority: ${ticket.requestedPriority}, Actions: ${actions.length}]`
    );
  }

  console.log(`Successfully seeded ${seedTickets.length} tickets with Actions Taken.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
