import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import * as schema from './src/db/schema';

config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function testDailySalary() {
  console.log('🔍 Testing Daily Salary Storage\n');

  try {
    // 1. Find Andrew Chee
    const andrewChee = await db.query.partTimers.findFirst({
      where: eq(schema.partTimers.name, 'Andrew Chee'),
    });

    if (!andrewChee) {
      console.log('❌ Andrew Chee not found in database');
      return;
    }

    console.log('✅ Found Andrew Chee:');
    console.log(`   ID: ${andrewChee.id}`);
    console.log(`   Name: ${andrewChee.name}\n`);

    // 2. Find events where Andrew Chee is assigned
    const allEvents = await db.query.events.findMany();
    const eventDailyAssignments = await db.query.eventDailyAssignments.findMany();
    const eventStaffSalaries = await db.query.eventStaffSalaries.findMany();

    console.log('📅 Events with Andrew Chee assigned:\n');

    let foundAssignments = false;

    for (const event of allEvents) {
      const assignments = eventDailyAssignments.filter(
        (a) => a.eventId === event.id && a.assignedPartTimers.includes(andrewChee.id)
      );

      if (assignments.length > 0) {
        foundAssignments = true;
        console.log(`Event: ${event.name} (${event.id})`);
        console.log(`Date Range: ${event.startDate} to ${event.endDate}`);
        console.log(`\nDaily Assignments for Andrew Chee:`);

        assignments.forEach((assignment) => {
          console.log(`  - ${assignment.date}: Assigned`);
        });

        // Check staff salary for this event
        const salary = eventStaffSalaries.find(
          (s) => s.eventId === event.id && s.partTimerId === andrewChee.id
        );

        if (salary) {
          console.log(`\n💰 Stored Salary: RM ${salary.salary}`);
        } else {
          console.log(`\n⚠️  No salary stored for this event`);
        }

        console.log('\n' + '='.repeat(60) + '\n');
      }
    }

    if (!foundAssignments) {
      console.log('⚠️  Andrew Chee is not assigned to any events\n');
    }

    // 3. Show all event staff salaries table
    console.log('📊 All Event Staff Salaries:\n');
    if (eventStaffSalaries.length === 0) {
      console.log('⚠️  No salaries stored in event_staff_salaries table\n');
    } else {
      eventStaffSalaries.forEach((salary) => {
        const event = allEvents.find((e) => e.id === salary.eventId);
        const partTimer = event ? 'Found' : 'Not found';
        console.log(`Event ID: ${salary.eventId.substring(0, 8)}...`);
        console.log(`Part-Timer ID: ${salary.partTimerId.substring(0, 8)}...`);
        console.log(`Salary: RM ${salary.salary}`);
        console.log(`Event: ${event?.name || 'Unknown'}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testDailySalary().catch(console.error);
