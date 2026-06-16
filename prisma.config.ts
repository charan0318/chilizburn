import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  generator: {
    provider: "prisma-client-js",
  },
  datasource: {
    provider: "postgresql",
    url: process.env.DIRECT_URL,
  },
});