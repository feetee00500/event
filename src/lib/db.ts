import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";

function databaseUrl(): string {
  try {
    const context = getCloudflareContext();
    if (context.env.HYPERDRIVE?.connectionString) return context.env.HYPERDRIVE.connectionString;
    if (context.env.DATABASE_URL) return context.env.DATABASE_URL;
  } catch {
    // Next dev/test use process.env instead of a Workers request context.
  }
  return process.env.DATABASE_URL ?? "";
}

function createPrismaClient(): PrismaClient {
  const connectionString = databaseUrl();
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  const adapter = new PrismaPg({ connectionString, max: 1 });
  return new PrismaClient({ adapter });
}

// OpenNext Workers must not reuse a module-global Prisma client across requests.
// React cache scopes this factory to the current server request. It avoids sharing a
// Prisma client between independent Workers requests while deduplicating local calls.
export const getDb = cache(createPrismaClient);
