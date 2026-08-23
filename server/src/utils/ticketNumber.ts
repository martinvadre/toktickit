import { PrismaClient } from "@prisma/client";

export function generateTicketNumber(date: Date = new Date(), sequence: number = 1): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(4, "0");
  return `TCK-${year}${month}${day}-${seq}`;
}

export async function getNextTicketNumber(
  prismaClient: PrismaClient,
  date: Date = new Date()
): Promise<string> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prismaClient.ticket.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return generateTicketNumber(date, count + 1);
}
