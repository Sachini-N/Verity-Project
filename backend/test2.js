const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.announcement.findMany().then(a => console.log(JSON.stringify(a, null, 2))).catch(console.error).finally(() => prisma.$disconnect());
