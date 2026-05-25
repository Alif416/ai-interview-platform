require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create users
  const interviewer = await prisma.user.upsert({
    where: { email: 'interviewer@google.com' },
    update: {},
    create: {
      email: 'interviewer@google.com',
      name: 'Senior Engineer',
      role: 'INTERVIEWER'
    }
  })

  const candidate = await prisma.user.upsert({
    where: { email: 'alif@example.com' },
    update: {},
    create: {
      email: 'alif@example.com',
      name: 'Alif',
      role: 'CANDIDATE'
    }
  })

  // Create a session
  await prisma.interviewSession.create({
    data: {
      title: 'Google L3 Technical Interview',
      role: 'Software Engineer',
      level: 'L3',
      status: 'SCHEDULED',
      scheduledAt: new Date('2024-12-01T10:00:00Z'),
      interviewerId: interviewer.id,
      candidateId: candidate.id
    }
  })

  console.log('✅ Database seeded successfully')
  console.log(`👤 Interviewer: ${interviewer.email}`)
  console.log(`👤 Candidate: ${candidate.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })