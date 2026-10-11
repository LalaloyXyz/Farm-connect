import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  // TiDB requires SSL and longer timeout
  if (url.includes("tidbcloud.com")) {
    const connectionUrl = new URL(url);
    const adapter = new PrismaMariaDb({
      host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
      port: 4000,
      user: decodeURIComponent(connectionUrl.username),
      password: decodeURIComponent(connectionUrl.password),
      database: "farmconnect",
      ssl: { rejectUnauthorized: true },
      connectionLimit: 5,
      connectTimeout: 15000,
      socketTimeout: 30000,
    });
    return new PrismaClient({ adapter });
  }

  // Local MySQL
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
