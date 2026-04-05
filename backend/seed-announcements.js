const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample announcements...');

  // Ensure we have a Manager and a Lecturer to act as authors
  let manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });
  if (!manager) {
    manager = await prisma.user.create({
      data: { name: 'System Admin', email: 'admin@verity.lk', password: 'pass', role: 'MANAGER' }
    });
  }

  let lecturer = await prisma.user.findFirst({ where: { role: 'LECTURER' } });
  if (!lecturer) {
    lecturer = await prisma.user.create({
      data: { name: 'Dr. John Doe', email: 'johndoe@verity.lk', password: 'pass', role: 'LECTURER' }
    });
  }

  // Create announcements
  const announcementsData = [
    {
      title: 'Mid-Semester Exam Schedule Released',
      content: 'The mid-semester examination timetable for SE3050 and SE3060 has been published. Please review the schedule and report any clash within 48 hours.',
      category: 'Urgent',
      targetAudience: 'SE3050',
      isPinned: true,
      authorId: lecturer.id
    },
    {
      title: 'Scheduled Platform Maintenance',
      content: 'Verity will undergo scheduled maintenance on Saturday from 12:00 AM to 4:00 AM IST. Save your work before the window. All unsaved progress will be lost.',
      category: 'Urgent',
      targetAudience: 'System',
      isPinned: true,
      authorId: manager.id
    },
    {
      title: 'Guest Lecture: Cloud-Native Architecture',
      content: 'We have a guest lecture by a senior engineer from WSO2 on Thursday at 2 PM. Attendance is mandatory for all SE3060 students. Venue: Main Auditorium.',
      category: 'Academic',
      targetAudience: 'SE3060',
      isPinned: false,
      authorId: lecturer.id
    },
    {
      title: 'New Module Registration Open',
      content: 'Registration for elective modules in Semester 2 is now open. Deadline: April 15th. Visit the registration portal or contact your academic advisor for guidance.',
      category: 'General',
      targetAudience: 'All Modules',
      isPinned: false,
      authorId: manager.id
    },
    {
      title: 'Final Year Project Guidelines',
      content: '<h2>Final Year Project Phase 1</h2><p>Please note that the deadline for submitting the initial project proposal is rapidly approaching. Ensure your document comprehensively covers the following areas:</p><ul><li>Architecture diagram and data flow</li><li>Technology stack (Frontend & Backend)</li><li>Individual team member roles</li></ul><p>For more details, please see the module handbook.</p>',
      category: 'Academic',
      targetAudience: 'IT3040',
      isPinned: false,
      authorId: lecturer.id
    },
    {
      title: 'Campus IT Network Upgrade',
      content: '<h2>Scheduled Network Outage</h2><p>The campus IT infrastructure team is performing upgrades on the primary network switches tonight. During this downtime, the following systems will be <strong>completely offline</strong>:</p><ol><li>Library Digital Archives</li><li>Student Registration Portal</li><li>Internal Campus VPN</li></ol><p><em>We appreciate your patience while we speed up the network!</em></p>',
      category: 'Urgent',
      targetAudience: 'System',
      isPinned: true,
      authorId: manager.id
    }
  ];

  for (const a of announcementsData) {
    await prisma.announcement.create({ data: a });
  }

  console.log('Successfully inserted sample announcements!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
