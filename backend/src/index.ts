// src/index.ts
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

async function main() {
  // Test DB connection
  await prisma.$connect();
  console.log('✅ Database connected');

  app.listen(env.PORT, () => {
    console.log(`🚀 WMS Backend running on http://localhost:${env.PORT}`);
    console.log(`   ENV: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
