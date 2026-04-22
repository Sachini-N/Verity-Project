const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Helper to clear existing data to avoid unique constraint errors during iterative seeding
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.taskStatusLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.githubRepo.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.module.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.year.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Academic Years, Semesters, and Modules
  const yearsData = [
    { name: 'Year 1', prefix: '1' },
    { name: 'Year 2', prefix: '2' },
    { name: 'Year 3', prefix: '3' },
    { name: 'Year 4', prefix: '4' },
  ];

  const createdSemesters = [];
  const createdModules = [];

  for (const year of yearsData) {
    const y = await prisma.year.create({ data: { name: year.name } });
    
    // Create Semester 1 and Semester 2 for each year
    for (let s = 1; s <= 2; s++) {
      const semester = await prisma.semester.create({
        data: { name: `Semester ${s}`, yearId: y.id }
      });
      createdSemesters.push(semester);

      // Create 5 modules per semester
      for (let m = 1; m <= 5; m++) {
        const modCode = `IT${year.prefix}0${s}${m}0`; // e.g., IT10110
        const module = await prisma.module.create({
          data: {
            code: modCode,
            name: `Core Module ${m} - ${year.name} S${s}`,
            semesterId: semester.id
          }
        });
        createdModules.push(module);
      }
    }
  }

  // Keep references to s1, s2, m1, m2 for relations below
  const s1 = createdSemesters[0];
  const s2 = createdSemesters[1];
  const m1 = createdModules[0];
  const m2 = createdModules[1];
  // Generate hash at runtime with bcryptjs for compatibility
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create a Manager
  const manager = await prisma.user.create({
    data: {
      name: 'System Manager',
      email: 'manager@verity.edu',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  // 3. Create a Lecturer
  const lecturer = await prisma.user.create({
    data: {
      name: 'Dr. Alan Turing',
      email: 'alan@verity.edu',
      password: hashedPassword,
      role: 'LECTURER',
      modules: { connect: [{ id: m1.id }, { id: m2.id }] }
    },
  });

  // 4. Create 4 Students (The Group)
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Alice Smith', email: 'alice@student.edu', password: hashedPassword, role: 'STUDENT', indexNumber: 'IT21000001', semesterId: s1.id }}),
    prisma.user.create({ data: { name: 'Bob Jones', email: 'bob@student.edu', password: hashedPassword, role: 'STUDENT', indexNumber: 'IT21000002', semesterId: s1.id }}),
    prisma.user.create({ data: { name: 'Charlie Brown', email: 'charlie@student.edu', password: hashedPassword, role: 'STUDENT', indexNumber: 'IT21000003', semesterId: s1.id }}),
    prisma.user.create({ data: { name: 'Diana Prince', email: 'diana@student.edu', password: hashedPassword, role: 'STUDENT', indexNumber: 'IT21000004', semesterId: s1.id }}),
  ]);


  const [alice, bob, charlie, diana] = users;

  // 4. Create an active Project
  const project = await prisma.project.create({
    data: {
      title: 'Verity Web System',
      description: 'AI-driven project intelligence platform for academic tracking.',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-05-30'),
      status: 'Active',
      members: {
        create: [
          { userId: alice.id, role: 'LEADER' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
          { userId: diana.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 5. Create a Sprint
  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1 - Foundation',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-14'),
    },
  });

  // 6. Create Tasks
  await prisma.task.create({
    data: {
      projectId: project.id,
      sprintId: sprint.id,
      title: 'Setup Database Schema',
      description: 'Write Prisma schema and migrate.',
      assigneeId: alice.id,
      status: 'Done',
      priority: 'High',
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      sprintId: sprint.id,
      title: 'Implement JWT Auth',
      description: 'Backend login endpoints with bcrypt.',
      assigneeId: bob.id,
      status: 'In Progress',
      priority: 'High',
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      sprintId: sprint.id,
      title: 'Design Kanban UI',
      description: 'React Drag and Drop board.',
      assigneeId: charlie.id,
      status: 'To Do',
      priority: 'Medium',
    },
  });

  // GitHub repo links are created per project from the Code Repo UI (no default link — avoids sharing one repo across multiple projects)

  console.log('Seed completed successfully. Users created with password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
