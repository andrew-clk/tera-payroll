import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Seed Part Timers
    console.log('📝 Seeding part-timers...');
    await db.insert(schema.partTimers).values([
      {
        id: '1',
        name: 'Ahmad bin Ismail',
        ic: '901234-01-1234',
        contact: '+60123456789',
        bankName: 'Maybank',
        bankAccount: '1234567890',
        defaultRate: '15.00',
        status: 'active',
      },
      {
        id: '2',
        name: 'Siti Aminah binti Abdullah',
        ic: '951210-14-5678',
        contact: '+60198765432',
        bankName: 'CIMB',
        bankAccount: '9876543210',
        defaultRate: '18.00',
        status: 'active',
      },
      {
        id: '3',
        name: 'Lee Wei Ming',
        ic: '880512-10-9012',
        contact: '+60161234567',
        bankName: 'Public Bank',
        bankAccount: '1122334455',
        defaultRate: '16.00',
        status: 'active',
      },
      {
        id: '4',
        name: 'Priya a/p Ramasamy',
        ic: '920815-08-3456',
        contact: '+60174567890',
        bankName: 'Hong Leong',
        bankAccount: '5566778899',
        defaultRate: '15.00',
        status: 'inactive',
      },
      {
        id: '5',
        name: 'Muhammad Hafiz',
        ic: '980323-06-7890',
        contact: '+60187654321',
        bankName: 'RHB',
        bankAccount: '6677889900',
        defaultRate: '17.00',
        status: 'active',
      },
    ]);

    // Seed Events
    console.log('📅 Seeding events...');
    await db.insert(schema.events).values([
      {
        id: '1',
        name: 'Tera Diet Health Fair 2024',
        date: '2024-01-28',
        startTime: '09:00',
        endTime: '18:00',
        location: 'KLCC Convention Centre',
        assignedPartTimers: ['1', '2', '3'],
      },
      {
        id: '2',
        name: 'Wellness Workshop - Nutrition Basics',
        date: '2024-01-30',
        startTime: '14:00',
        endTime: '17:00',
        location: 'Tera Diet HQ',
        assignedPartTimers: ['2', '5'],
      },
      {
        id: '3',
        name: 'Community Health Screening',
        date: '2024-02-05',
        startTime: '08:00',
        endTime: '16:00',
        location: 'Taman Melawati Community Hall',
        assignedPartTimers: ['1', '3', '5'],
      },
      {
        id: '4',
        name: 'Corporate Wellness Day - ABC Corp',
        date: '2024-02-10',
        startTime: '10:00',
        endTime: '15:00',
        location: 'ABC Corporation Office',
        assignedPartTimers: ['2'],
      },
      {
        id: '5',
        name: 'Diet Consultation Drive',
        date: '2024-02-15',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Mid Valley Megamall',
        assignedPartTimers: ['1', '2', '3', '5'],
      },
    ]);

    // Seed Attendance
    console.log('⏰ Seeding attendance...');
    await db.insert(schema.attendance).values([
      {
        id: '1',
        partTimerId: '1',
        eventId: '1',
        clockIn: new Date('2024-01-28T08:55:00'),
        clockOut: new Date('2024-01-28T18:05:00'),
        hoursWorked: '9.17',
        status: 'completed',
      },
      {
        id: '2',
        partTimerId: '2',
        eventId: '1',
        clockIn: new Date('2024-01-28T09:02:00'),
        clockOut: new Date('2024-01-28T18:00:00'),
        hoursWorked: '8.97',
        status: 'completed',
      },
      {
        id: '3',
        partTimerId: '3',
        eventId: '1',
        clockIn: new Date('2024-01-28T08:58:00'),
        clockOut: new Date('2024-01-28T17:55:00'),
        hoursWorked: '8.95',
        status: 'completed',
      },
      {
        id: '4',
        partTimerId: '2',
        eventId: '2',
        clockIn: new Date('2024-01-30T13:55:00'),
        clockOut: new Date('2024-01-30T17:10:00'),
        hoursWorked: '3.25',
        status: 'completed',
      },
      {
        id: '5',
        partTimerId: '5',
        eventId: '2',
        clockIn: new Date('2024-01-30T14:00:00'),
        status: 'clocked-in',
      },
    ]);

    // Seed Payroll
    console.log('💰 Seeding payroll...');
    await db.insert(schema.payroll).values([
      {
        id: '1',
        partTimerId: '1',
        dateRangeStart: '2024-01-01',
        dateRangeEnd: '2024-01-31',
        totalHours: '45.5',
        rate: '15.00',
        transportAllowance: '50.00',
        mealAllowance: '30.00',
        bonus: '0.00',
        totalPay: '762.50',
        status: 'confirmed',
      },
      {
        id: '2',
        partTimerId: '2',
        dateRangeStart: '2024-01-01',
        dateRangeEnd: '2024-01-31',
        totalHours: '38.2',
        rate: '18.00',
        transportAllowance: '40.00',
        mealAllowance: '25.00',
        bonus: '50.00',
        totalPay: '802.60',
        status: 'confirmed',
      },
      {
        id: '3',
        partTimerId: '3',
        dateRangeStart: '2024-01-01',
        dateRangeEnd: '2024-01-31',
        totalHours: '32.0',
        rate: '16.00',
        transportAllowance: '35.00',
        mealAllowance: '20.00',
        bonus: '0.00',
        totalPay: '567.00',
        status: 'draft',
      },
      {
        id: '4',
        partTimerId: '5',
        dateRangeStart: '2024-01-01',
        dateRangeEnd: '2024-01-31',
        totalHours: '28.5',
        rate: '17.00',
        transportAllowance: '30.00',
        mealAllowance: '20.00',
        bonus: '25.00',
        totalPay: '559.50',
        status: 'draft',
      },
    ]);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
