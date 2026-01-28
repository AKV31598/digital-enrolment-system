/**
 * ============================================================================
 * DATABASE SEED FILE - Digital Enrolment System
 * ============================================================================
 * 
 * This file populates the database with initial test data for development.
 * Run it with: npm run db:seed
 * 
 * What gets created:
 * 1. HR Manager user (can manage everything)
 * 2. Insurance Policy (the group policy employees belong to)
 * 3. Sample Employees (with user accounts for login)
 * 4. Sample Dependents (family members for employees)
 * 
 * Test Credentials:
 * - HR Manager: hr_admin / password123
 * - Employee 1: john.doe / password123
 * - Employee 2: jane.smith / password123
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Create a new Prisma Client instance
const prisma = new PrismaClient();

/**
 * Main seed function
 * ------------------
 * This function runs all the seeding logic inside a transaction
 * to ensure data consistency. If any part fails, everything rolls back.
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // ========================================================================
  // STEP 1: Create HR Manager User
  // ========================================================================
  // The HR Manager has full access to manage employees and dependents
  console.log('👤 Creating HR Manager user...');
  
  const hrPassword = await bcrypt.hash('password123', 10);
  
  const hrManager = await prisma.user.upsert({
    where: { username: 'hr_admin' },
    update: {},  // If exists, don't update anything
    create: {
      username: 'hr_admin',
      password: hrPassword,
      firstName: 'Admin',
      lastName: 'HR Manager',
      email: 'hr@prishapolicy.com',
      role: 'HR_MANAGER',
    },
  });
  
  console.log(`   ✓ Created HR Manager: ${hrManager.username} (ID: ${hrManager.id})`);

  // ========================================================================
  // STEP 2: Create Insurance Policy
  // ========================================================================
  // This is the group insurance policy that employees will be enrolled in
  console.log('\n📋 Creating Insurance Policy...');
  
  const policy = await prisma.insurancePolicy.upsert({
    where: { policyNumber: 'POL-2024-001' },
    update: {},
    create: {
      policyNumber: 'POL-2024-001',
      policyName: 'Group Health Insurance - Premium',
      companyName: 'TechCorp Solutions Pvt. Ltd.',
      hrManagerId: hrManager.id,
    },
  });
  
  console.log(`   ✓ Created Policy: ${policy.policyName}`);
  console.log(`     Policy Number: ${policy.policyNumber}`);
  console.log(`     Company: ${policy.companyName}`);

  // ========================================================================
  // STEP 3: Create Employee Users and Their Employee Records
  // ========================================================================
  // Each employee has:
  // - A User account (for login)
  // - An Employee record (their HR data)
  // - Optionally, Member records (their dependents)
  console.log('\n👥 Creating Employee users...');
  
  const employeePassword = await bcrypt.hash('password123', 10);
  
  // ---------- Employee 1: John Doe ----------
  const johnUser = await prisma.user.upsert({
    where: { username: 'john.doe' },
    update: {},
    create: {
      username: 'john.doe',
      password: employeePassword,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@techcorp.com',
      role: 'EMPLOYEE',
    },
  });
  
  const johnEmployee = await prisma.employee.upsert({
    where: { 
      policyId_employeeCode: {
        policyId: policy.id,
        employeeCode: 'EMP001',
      }
    },
    update: {},
    create: {
      employeeCode: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@techcorp.com',
      phone: '+91 98765 43210',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      policyId: policy.id,
      userId: johnUser.id,
    },
  });
  
  console.log(`   ✓ Created Employee: ${johnEmployee.firstName} ${johnEmployee.lastName}`);
  console.log(`     Employee Code: ${johnEmployee.employeeCode}`);
  console.log(`     Department: ${johnEmployee.department}`);

  // ---------- Employee 2: Jane Smith ----------
  const janeUser = await prisma.user.upsert({
    where: { username: 'jane.smith' },
    update: {},
    create: {
      username: 'jane.smith',
      password: employeePassword,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@techcorp.com',
      role: 'EMPLOYEE',
    },
  });
  
  const janeEmployee = await prisma.employee.upsert({
    where: { 
      policyId_employeeCode: {
        policyId: policy.id,
        employeeCode: 'EMP002',
      }
    },
    update: {},
    create: {
      employeeCode: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@techcorp.com',
      phone: '+91 98765 43211',
      dateOfBirth: new Date('1988-11-22'),
      gender: 'Female',
      department: 'Product',
      designation: 'Product Manager',
      policyId: policy.id,
      userId: janeUser.id,
    },
  });
  
  console.log(`   ✓ Created Employee: ${janeEmployee.firstName} ${janeEmployee.lastName}`);
  console.log(`     Employee Code: ${janeEmployee.employeeCode}`);
  console.log(`     Department: ${janeEmployee.department}`);

  // ---------- Employee 3: Mike Wilson (No user account) ----------
  // This employee exists in the system but cannot log in
  const mikeEmployee = await prisma.employee.upsert({
    where: { 
      policyId_employeeCode: {
        policyId: policy.id,
        employeeCode: 'EMP003',
      }
    },
    update: {},
    create: {
      employeeCode: 'EMP003',
      firstName: 'Mike',
      lastName: 'Wilson',
      email: 'mike.wilson@techcorp.com',
      phone: '+91 98765 43212',
      dateOfBirth: new Date('1985-03-08'),
      gender: 'Male',
      department: 'Sales',
      designation: 'Sales Executive',
      policyId: policy.id,
      // No userId - this employee cannot log in
    },
  });
  
  console.log(`   ✓ Created Employee: ${mikeEmployee.firstName} ${mikeEmployee.lastName} (no login)`);

  // ========================================================================
  // STEP 4: Create Dependents (Family Members)
  // ========================================================================
  console.log('\n👨‍👩‍👧‍👦 Creating Dependents...');
  
  // ---------- John's Dependents ----------
  // John has himself as "SELF", a spouse, and two children
  
  // Self record (represents John himself as a member)
  await prisma.member.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      relationship: 'SELF',
      employeeId: johnEmployee.id,
      createdById: hrManager.id,
    },
  });
  
  // Spouse
  await prisma.member.upsert({
    where: { id: 2 },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Doe',
      dateOfBirth: new Date('1992-08-20'),
      gender: 'Female',
      relationship: 'SPOUSE',
      employeeId: johnEmployee.id,
      createdById: hrManager.id,
    },
  });
  
  // Child 1
  await prisma.member.upsert({
    where: { id: 3 },
    update: {},
    create: {
      firstName: 'Tommy',
      lastName: 'Doe',
      dateOfBirth: new Date('2018-03-10'),
      gender: 'Male',
      relationship: 'CHILD',
      employeeId: johnEmployee.id,
      createdById: johnUser.id,  // Added by John himself
    },
  });
  
  // Child 2
  await prisma.member.upsert({
    where: { id: 4 },
    update: {},
    create: {
      firstName: 'Emma',
      lastName: 'Doe',
      dateOfBirth: new Date('2020-07-25'),
      gender: 'Female',
      relationship: 'CHILD',
      employeeId: johnEmployee.id,
      createdById: johnUser.id,
    },
  });
  
  console.log(`   ✓ Created 4 dependents for John Doe`);
  
  // ---------- Jane's Dependents ----------
  // Jane has herself and one parent
  
  await prisma.member.upsert({
    where: { id: 5 },
    update: {},
    create: {
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1988-11-22'),
      gender: 'Female',
      relationship: 'SELF',
      employeeId: janeEmployee.id,
      createdById: hrManager.id,
    },
  });
  
  await prisma.member.upsert({
    where: { id: 6 },
    update: {},
    create: {
      firstName: 'Margaret',
      lastName: 'Smith',
      dateOfBirth: new Date('1958-04-12'),
      gender: 'Female',
      relationship: 'PARENT',
      employeeId: janeEmployee.id,
      createdById: janeUser.id,
    },
  });
  
  console.log(`   ✓ Created 2 dependents for Jane Smith`);
  
  // ---------- Mike's Dependents ----------
  // Mike only has himself registered
  
  await prisma.member.upsert({
    where: { id: 7 },
    update: {},
    create: {
      firstName: 'Mike',
      lastName: 'Wilson',
      dateOfBirth: new Date('1985-03-08'),
      gender: 'Male',
      relationship: 'SELF',
      employeeId: mikeEmployee.id,
      createdById: hrManager.id,
    },
  });
  
  console.log(`   ✓ Created 1 dependent for Mike Wilson`);

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ Database seeding completed successfully!');
  console.log('='.repeat(60));
  console.log('\n📝 Test Credentials:');
  console.log('   HR Manager:  hr_admin / password123');
  console.log('   Employee 1:  john.doe / password123');
  console.log('   Employee 2:  jane.smith / password123');
  console.log('\n🚀 You can now start the application with: npm run dev\n');
}

// ========================================================================
// Execute the seed function
// ========================================================================
main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect from the database when done
    await prisma.$disconnect();
  });
