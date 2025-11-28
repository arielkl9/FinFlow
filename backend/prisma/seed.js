import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing database with default categories...');

  // Create Household system account
  const household = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Household', isSystemAccount: true },
  });

  console.log('✅ Created Household system account');

  // Create default categories
  const categories = await Promise.all([
    // Income Categories
    prisma.category.upsert({
      where: { name_type: { name: 'Salary', type: 'Income' } },
      update: {},
      create: { name: 'Salary', type: 'Income', isRecurring: true, isStatic: true, isHousehold: false, defaultAmount: 0 },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Freelance', type: 'Income' } },
      update: {},
      create: { name: 'Freelance', type: 'Income', isRecurring: false, isStatic: false, isHousehold: false },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Investment Returns', type: 'Income' } },
      update: {},
      create: { name: 'Investment Returns', type: 'Income', isRecurring: false, isStatic: false, isHousehold: false },
    }),

    // Fixed Expense Categories (Household)
    prisma.category.upsert({
      where: { name_type: { name: 'Rent', type: 'Fixed Expense' } },
      update: {},
      create: { name: 'Rent', type: 'Fixed Expense', isRecurring: true, isStatic: true, isHousehold: true, defaultAmount: 0 },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Property Tax', type: 'Fixed Expense' } },
      update: {},
      create: { name: 'Property Tax', type: 'Fixed Expense', isRecurring: true, isStatic: true, isHousehold: true, defaultAmount: 0 },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Insurance', type: 'Fixed Expense' } },
      update: {},
      create: { name: 'Insurance', type: 'Fixed Expense', isRecurring: true, isStatic: true, isHousehold: true, defaultAmount: 0 },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Groceries', type: 'Fixed Expense' } },
      update: {},
      create: { name: 'Groceries', type: 'Fixed Expense', isRecurring: true, isStatic: false, isHousehold: true },
    }),

    // Utility Categories (Household)
    prisma.category.upsert({
      where: { name_type: { name: 'Electricity', type: 'Utility' } },
      update: {},
      create: { name: 'Electricity', type: 'Utility', isRecurring: true, isStatic: false, isHousehold: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Water', type: 'Utility' } },
      update: {},
      create: { name: 'Water', type: 'Utility', isRecurring: true, isStatic: false, isHousehold: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Internet', type: 'Utility' } },
      update: {},
      create: { name: 'Internet', type: 'Utility', isRecurring: true, isStatic: true, isHousehold: true, defaultAmount: 0 },
    }),
    prisma.category.upsert({
      where: { name_type: { name: 'Gas', type: 'Utility' } },
      update: {},
      create: { name: 'Gas', type: 'Utility', isRecurring: true, isStatic: false, isHousehold: true },
    }),
  ]);

  console.log('✅ Created', categories.length, 'default categories');
  console.log('');
  console.log('📋 Categories created:');
  console.log('   Income: Salary, Freelance, Investment Returns');
  console.log('   Fixed Expenses: Rent, Property Tax, Insurance, Groceries');
  console.log('   Utilities: Electricity, Water, Internet, Gas');
  console.log('');
  console.log('🎉 Database initialization complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add family members via the app');
  console.log('  2. Add your loans and debts');
  console.log('  3. Start tracking your monthly finances');
}

main()
  .catch((e) => {
    console.error('❌ Initialization failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
