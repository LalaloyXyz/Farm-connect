import { defineConfig, env } from "prisma/config";

// In Vercel, DATABASE_URL comes from env vars.
// Locally, dotenv loads .env
try {
  require("dotenv/config");
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
