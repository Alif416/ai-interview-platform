require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcrypt')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const hashedPassword = await bcrypt.hash('password123', 12)

  const interviewer = await prisma.user.upsert({
    where: { email: 'interviewer@google.com' },
    update: { password: hashedPassword },
    create: {
      email: 'interviewer@google.com',
      name: 'Senior Engineer',
      password: hashedPassword,
      role: 'INTERVIEWER'
    }
  })

  const candidate = await prisma.user.upsert({
    where: { email: 'alif@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'alif@example.com',
      name: 'Alif',
      password: hashedPassword,
      role: 'CANDIDATE'
    }
  })

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

  console.log('✅ Seeded successfully')
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect())