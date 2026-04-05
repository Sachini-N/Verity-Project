const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.announcement.findMany().then(ans => {
  ans.forEach(a => console.log(a.id, a.title));
}).catch(console.error).finally(() => prisma.$disconnect());
