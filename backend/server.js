import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get previous month in YYYY-MM format
 */
function getPreviousMonth(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get last N months as array of YYYY-MM strings
 */
function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// ============================================
// USER ROUTES
// ============================================

// Get all users
// Ensure Household system account exists
async function ensureHouseholdAccount() {
  const household = await prisma.user.findFirst({
    where: { isSystemAccount: true },
  });
  
  if (!household) {
    await prisma.user.create({
      data: { name: 'Household', isSystemAccount: true },
    });
    console.log('Created Household system account');
  }
  
  return household || await prisma.user.findFirst({ where: { isSystemAccount: true } });
}

// Get Household account ID
async function getHouseholdAccountId() {
  const household = await prisma.user.findFirst({
    where: { isSystemAccount: true },
  });
  return household?.id;
}

app.get('/api/users', async (req, res) => {
  try {
    // Only return non-system accounts (real users)
    const users = await prisma.user.findMany({
      where: { isSystemAccount: false },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get Household account info
app.get('/api/users/household', async (req, res) => {
  try {
    const household = await prisma.user.findFirst({
      where: { isSystemAccount: true },
    });
    res.json(household);
  } catch (error) {
    console.error('Error fetching household account:', error);
    res.status(500).json({ error: 'Failed to fetch household account' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.create({
      data: { name },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// CATEGORY ROUTES
// ============================================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, type, isRecurring, isStatic, isHousehold, defaultAmount } = req.body;
    const category = await prisma.category.create({
      data: { 
        name, 
        type, 
        isRecurring: isRecurring ?? true,
        isStatic: isStatic ?? false,
        isHousehold: isHousehold ?? true,
        defaultAmount: parseFloat(defaultAmount) || 0,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Category with this name and type already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// Update category (for setting default amounts)
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, isRecurring, isStatic, isHousehold, defaultAmount } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (isStatic !== undefined) updateData.isStatic = isStatic;
    if (isHousehold !== undefined) updateData.isHousehold = isHousehold;
    if (defaultAmount !== undefined) updateData.defaultAmount = parseFloat(defaultAmount) || 0;

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// FINANCIAL RECORDS ROUTES
// ============================================

// Get financial records (with optional filters)
app.get('/api/records', async (req, res) => {
  try {
    const { userId, monthYear, categoryType } = req.query;
    
    const where = {};
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }
    if (monthYear) {
      where.monthYear = monthYear;
    }
    if (categoryType) {
      where.category = { type: categoryType };
    }

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        user: true,
        category: true,
      },
      orderBy: [{ monthYear: 'desc' }, { categoryId: 'asc' }],
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Create or update financial record
app.post('/api/records', async (req, res) => {
  try {
    const { userId, categoryId, amount, monthYear, note } = req.body;
    
    const record = await prisma.financialRecord.upsert({
      where: {
        userId_categoryId_monthYear: {
          userId: parseInt(userId),
          categoryId: parseInt(categoryId),
          monthYear,
        },
      },
      update: { amount: parseFloat(amount), note },
      create: {
        userId: parseInt(userId),
        categoryId: parseInt(categoryId),
        amount: parseFloat(amount),
        monthYear,
        note,
      },
      include: {
        user: true,
        category: true,
      },
    });
    res.json(record);
  } catch (error) {
    console.error('Error saving record:', error);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// Bulk update records
app.post('/api/records/bulk', async (req, res) => {
  try {
    const { records } = req.body;
    
    const results = await prisma.$transaction(
      records.map((record) =>
        prisma.financialRecord.upsert({
          where: {
            userId_categoryId_monthYear: {
              userId: parseInt(record.userId),
              categoryId: parseInt(record.categoryId),
              monthYear: record.monthYear,
            },
          },
          update: { amount: parseFloat(record.amount), note: record.note },
          create: {
            userId: parseInt(record.userId),
            categoryId: parseInt(record.categoryId),
            amount: parseFloat(record.amount),
            monthYear: record.monthYear,
            note: record.note,
          },
        })
      )
    );
    
    res.json(results);
  } catch (error) {
    console.error('Error bulk saving records:', error);
    res.status(500).json({ error: 'Failed to save records' });
  }
});

// Delete single record
app.delete('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.financialRecord.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Bulk delete records
app.post('/api/records/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No record IDs provided' });
    }

    const result = await prisma.financialRecord.deleteMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) },
      },
    });
    
    res.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Deleted ${result.count} records` 
    });
  } catch (error) {
    console.error('Error bulk deleting records:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

// Delete all records for a specific month
app.delete('/api/records/month/:monthYear', async (req, res) => {
  try {
    const { monthYear } = req.params;
    const { userId } = req.query;
    
    const where = { monthYear };
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }

    const result = await prisma.financialRecord.deleteMany({ where });
    
    res.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Deleted ${result.count} records for ${monthYear}` 
    });
  } catch (error) {
    console.error('Error deleting month records:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

// ============================================
// LOANS ROUTES (Fixed monthly payment loans)
// ============================================

// Get all loans
app.get('/api/loans', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const where = {};
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }

    const loans = await prisma.loan.findMany({
      where,
      include: { user: true },
      orderBy: [{ remainingBalance: 'desc' }],
    });
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// Create loan
app.post('/api/loans', async (req, res) => {
  try {
    const { userId, name, totalPrincipal, remainingBalance, interestRate, monthlyPayment, startDate, targetPayoffDate } = req.body;
    
    const loan = await prisma.loan.create({
      data: {
        userId: parseInt(userId),
        name,
        totalPrincipal: parseFloat(totalPrincipal),
        remainingBalance: parseFloat(remainingBalance) || parseFloat(totalPrincipal),
        interestRate: parseFloat(interestRate) || 0,
        monthlyPayment: parseFloat(monthlyPayment),
        startDate: startDate ? new Date(startDate) : new Date(),
        targetPayoffDate: targetPayoffDate ? new Date(targetPayoffDate) : null,
      },
      include: { user: true },
    });
    res.status(201).json(loan);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// Update loan
app.put('/api/loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.totalPrincipal) updateData.totalPrincipal = parseFloat(updateData.totalPrincipal);
    if (updateData.remainingBalance) updateData.remainingBalance = parseFloat(updateData.remainingBalance);
    if (updateData.interestRate !== undefined) updateData.interestRate = parseFloat(updateData.interestRate);
    if (updateData.monthlyPayment) updateData.monthlyPayment = parseFloat(updateData.monthlyPayment);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.targetPayoffDate) updateData.targetPayoffDate = new Date(updateData.targetPayoffDate);
    if (updateData.userId) updateData.userId = parseInt(updateData.userId);
    
    const loan = await prisma.loan.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { user: true },
    });
    res.json(loan);
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ error: 'Failed to update loan' });
  }
});

// Delete loan
app.delete('/api/loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.loan.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ error: 'Failed to delete loan' });
  }
});

// ============================================
// DEBTS ROUTES (Variable paydown debts)
// ============================================

// Get all debts with payment history and transactions
app.get('/api/variable-debts', async (req, res) => {
  try {
    const { userId, monthYear } = req.query;
    
    const where = {};
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }

    const debts = await prisma.debt.findMany({
      where,
      include: { 
        user: true,
        payments: {
          orderBy: { monthYear: 'desc' },
          take: 12, // Last 12 payments
        },
      },
      orderBy: [{ currentBalance: 'desc' }],
    });
    
    // Fetch creditLimit for all debts using raw SQL
    const debtIds = debts.map(d => d.id);
    let creditLimits = {};
    if (debtIds.length > 0) {
      const rawDebts = await prisma.$queryRawUnsafe(
        `SELECT id, creditLimit FROM Debt WHERE id IN (${debtIds.join(',')})`
      );
      rawDebts.forEach(d => { creditLimits[d.id] = d.creditLimit || 0; });
    }
    
    // Add current month payment info and creditLimit
    const currentMonth = monthYear || getCurrentMonth();
    const result = debts.map(debt => {
      const currentPayment = debt.payments.find(p => p.monthYear === currentMonth);
      return {
        ...debt,
        creditLimit: creditLimits[debt.id] || 0,
        currentMonthPayment: currentPayment?.amount || 0,
        currentMonthPaymentId: currentPayment?.id,
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({ error: 'Failed to fetch debts' });
  }
});

// Create debt
app.post('/api/variable-debts', async (req, res) => {
  try {
    const { userId, name, currentBalance, creditLimit, minimumPayment, isTemporary } = req.body;
    
    // For temporary debts, minimum payment = full balance (pay in full next month)
    const isTemp = isTemporary === true || isTemporary === 'true';
    const minPayment = isTemp 
      ? parseFloat(currentBalance) 
      : (parseFloat(minimumPayment) || 0);
    
    const debt = await prisma.debt.create({
      data: {
        userId: parseInt(userId),
        name,
        currentBalance: parseFloat(currentBalance),
        minimumPayment: minPayment,
        isTemporary: isTemp,
      },
      include: { user: true, payments: true },
    });
    
    // Update creditLimit using raw SQL (Prisma client doesn't recognize it)
    const parsedLimit = parseFloat(creditLimit) || 0;
    if (parsedLimit > 0) {
      await prisma.$executeRaw`UPDATE Debt SET creditLimit = ${parsedLimit} WHERE id = ${debt.id}`;
    }
    
    // Fetch with creditLimit
    const result = await prisma.$queryRaw`SELECT * FROM Debt WHERE id = ${debt.id}`;
    res.status(201).json({ ...debt, creditLimit: result[0]?.creditLimit || 0 });
  } catch (error) {
    console.error('Error creating debt:', error);
    res.status(500).json({ error: 'Failed to create debt' });
  }
});

// Update debt
app.put('/api/variable-debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, currentBalance, creditLimit, minimumPayment, isTemporary } = req.body;
    
    console.log('Update debt request:', { id, body: req.body });
    
    // Check if switching to temporary
    const isSwitchingToTemporary = isTemporary === true || isTemporary === 'true';
    
    const updateData = {};
    // Note: userId is not updatable - cards belong to their original user
    if (name !== undefined && name !== '') updateData.name = name;
    if (currentBalance !== undefined) {
      const parsed = parseFloat(currentBalance);
      if (!isNaN(parsed)) updateData.currentBalance = parsed;
    }
    // Update creditLimit using raw SQL (Prisma client doesn't recognize it)
    if (creditLimit !== undefined) {
      const parsedLimit = parseFloat(creditLimit) || 0;
      await prisma.$executeRaw`UPDATE Debt SET creditLimit = ${parsedLimit} WHERE id = ${parseInt(id)}`;
    }
    
    if (isTemporary !== undefined) {
      updateData.isTemporary = isSwitchingToTemporary;
    }
    
    // Handle minimum payment
    if (minimumPayment !== undefined) {
      const parsed = parseFloat(minimumPayment);
      updateData.minimumPayment = isNaN(parsed) ? 0 : parsed;
    }
    
    // For temporary debts, minimum payment = full balance
    if (isSwitchingToTemporary && updateData.currentBalance !== undefined) {
      updateData.minimumPayment = updateData.currentBalance;
    }
    
    console.log('Update data:', updateData);
    
    const debt = await prisma.debt.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { user: true, payments: true },
    });
    
    // Fetch creditLimit from database
    const rawDebt = await prisma.$queryRaw`SELECT creditLimit FROM Debt WHERE id = ${parseInt(id)}`;
    const resultDebt = { ...debt, creditLimit: rawDebt[0]?.creditLimit || 0 };
    
    console.log('Update result:', resultDebt);
    res.json(resultDebt);
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

// Delete debt
app.delete('/api/variable-debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.debt.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt:', error);
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

// Record debt payment for a month
app.post('/api/variable-debts/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, monthYear, note } = req.body;
    const targetMonth = monthYear || getCurrentMonth();
    const newAmount = parseFloat(amount) || 0;
    
    // Check for existing payment for this month to calculate the difference
    const existingPayment = await prisma.debtPayment.findUnique({
      where: {
        debtId_monthYear: {
          debtId: parseInt(id),
          monthYear: targetMonth,
        },
      },
    });
    
    const previousAmount = existingPayment?.amount || 0;
    const amountDifference = newAmount - previousAmount;
    
    // Upsert payment
    const payment = await prisma.debtPayment.upsert({
      where: {
        debtId_monthYear: {
          debtId: parseInt(id),
          monthYear: targetMonth,
        },
      },
      update: { amount: newAmount, note },
      create: {
        debtId: parseInt(id),
        amount: newAmount,
        monthYear: targetMonth,
        note,
      },
    });
    
    // Update the current balance only by the DIFFERENCE (not the full amount)
    // This ensures changing the payment from 100 to 200 only deducts 100 more, not 200
    if (req.body.updateBalance && amountDifference !== 0) {
      const debt = await prisma.debt.findUnique({ where: { id: parseInt(id) } });
      if (debt) {
        await prisma.debt.update({
          where: { id: parseInt(id) },
          data: { currentBalance: Math.max(0, debt.currentBalance - amountDifference) },
        });
      }
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Get debt payment history
app.get('/api/variable-debts/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const payments = await prisma.debtPayment.findMany({
      where: { debtId: parseInt(id) },
      orderBy: { monthYear: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Delete a payment
app.delete('/api/variable-debts/:debtId/payment/:paymentId', async (req, res) => {
  try {
    const { debtId, paymentId } = req.params;
    const { revertBalance } = req.query;
    
    // Get the payment before deleting
    const payment = await prisma.debtPayment.findUnique({
      where: { id: parseInt(paymentId) },
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Revert the balance (add back what was paid) if requested
    if (revertBalance === 'true') {
      const debt = await prisma.debt.findUnique({ where: { id: parseInt(debtId) } });
      const newBalance = (debt?.currentBalance || 0) + payment.amount;
      
      await prisma.debt.update({
        where: { id: parseInt(debtId) },
        data: { currentBalance: newBalance },
      });
    }
    
    // Delete the payment
    await prisma.debtPayment.delete({
      where: { id: parseInt(paymentId) },
    });
    
    // Return updated debt
    const updatedDebt = await prisma.debt.findUnique({
      where: { id: parseInt(debtId) },
      include: { 
        user: true, 
        payments: { orderBy: { monthYear: 'desc' }, take: 12 },
      },
    });
    
    res.json(updatedDebt);
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// Pay debt in full (convenience endpoint for temporary debts)
app.post('/api/variable-debts/:id/pay-full', async (req, res) => {
  try {
    const { id } = req.params;
    const { monthYear } = req.body;
    const targetMonth = monthYear || getCurrentMonth();
    
    // Get the debt
    const debt = await prisma.debt.findUnique({ where: { id: parseInt(id) } });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    
    const fullAmount = debt.currentBalance;
    
    // Check for existing payment
    const existingPayment = await prisma.debtPayment.findUnique({
      where: {
        debtId_monthYear: {
          debtId: parseInt(id),
          monthYear: targetMonth,
        },
      },
    });
    
    const previousAmount = existingPayment?.amount || 0;
    const amountDifference = fullAmount - previousAmount;
    
    // Upsert payment for full amount
    const payment = await prisma.debtPayment.upsert({
      where: {
        debtId_monthYear: {
          debtId: parseInt(id),
          monthYear: targetMonth,
        },
      },
      update: { amount: fullAmount, note: 'Paid in full' },
      create: {
        debtId: parseInt(id),
        amount: fullAmount,
        monthYear: targetMonth,
        note: 'Paid in full',
      },
    });
    
    // Set balance to 0
    await prisma.debt.update({
      where: { id: parseInt(id) },
      data: { currentBalance: 0 },
    });
    
    res.json({ payment, message: 'Debt paid in full', amountPaid: fullAmount });
  } catch (error) {
    console.error('Error paying debt in full:', error);
    res.status(500).json({ error: 'Failed to pay debt in full' });
  }
});

// Update balance (SET new value, not add)
app.post('/api/variable-debts/:id/transaction', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // SET the new balance directly (not add)
    await prisma.debt.update({
      where: { id: parseInt(id) },
      data: { currentBalance: parsedAmount },
    });
    
    // Return updated debt
    const updatedDebt = await prisma.debt.findUnique({
      where: { id: parseInt(id) },
      include: { 
        user: true, 
        payments: { orderBy: { monthYear: 'desc' }, take: 12 },
      },
    });
    
    res.status(201).json({ ...updatedDebt, transactions: [] });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Get transactions for a debt (disabled until DebtTransaction table is created)
app.get('/api/variable-debts/:id/transactions', async (req, res) => {
  // Return empty array - transactions feature disabled
  res.json([]);
});

// Delete a transaction (disabled until DebtTransaction table is created)
app.delete('/api/variable-debts/:debtId/transaction/:transactionId', async (req, res) => {
  // Transactions feature disabled - return success
  res.json({ success: true, message: 'Transaction feature not yet available' });
});

// ============================================
// LEGACY DEBT METADATA ROUTES (keeping for backwards compatibility)
// ============================================

// Get all debts (with optional user filter)
app.get('/api/debts', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const where = {};
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }

    const debts = await prisma.debtMetadata.findMany({
      where,
      include: { user: true },
      orderBy: [{ interestRate: 'desc' }, { remainingBalance: 'desc' }],
    });
    res.json(debts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({ error: 'Failed to fetch debts' });
  }
});

// Create debt
app.post('/api/debts', async (req, res) => {
  try {
    const {
      userId,
      name,
      totalPrincipal,
      interestRate,
      monthlyPayment,
      targetPayoffDate,
      startDate,
      debtType,
      remainingBalance,
    } = req.body;
    
    const debt = await prisma.debtMetadata.create({
      data: {
        userId: parseInt(userId),
        name,
        totalPrincipal: parseFloat(totalPrincipal),
        interestRate: parseFloat(interestRate) || 0,
        monthlyPayment: parseFloat(monthlyPayment) || 0,
        targetPayoffDate: targetPayoffDate ? new Date(targetPayoffDate) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        debtType: debtType || 'Static Loan',
        remainingBalance: parseFloat(remainingBalance) || parseFloat(totalPrincipal),
      },
      include: { user: true },
    });
    res.status(201).json(debt);
  } catch (error) {
    console.error('Error creating debt:', error);
    res.status(500).json({ error: 'Failed to create debt' });
  }
});

// Update debt
app.put('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Parse numeric fields - use !== undefined to allow 0 values
    if (updateData.totalPrincipal !== undefined) updateData.totalPrincipal = parseFloat(updateData.totalPrincipal);
    if (updateData.interestRate !== undefined) updateData.interestRate = parseFloat(updateData.interestRate);
    if (updateData.monthlyPayment !== undefined) updateData.monthlyPayment = parseFloat(updateData.monthlyPayment);
    if (updateData.remainingBalance !== undefined) updateData.remainingBalance = parseFloat(updateData.remainingBalance);
    if (updateData.targetPayoffDate) updateData.targetPayoffDate = new Date(updateData.targetPayoffDate);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.userId) updateData.userId = parseInt(updateData.userId);
    
    const debt = await prisma.debtMetadata.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { user: true },
    });
    res.json(debt);
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

// Delete debt
app.delete('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.debtMetadata.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt:', error);
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

// ============================================
// DASHBOARD & ANALYTICS ROUTES
// ============================================

// Get comprehensive financial summary including loans and debts
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const { userId, monthYear } = req.query;
    const targetMonth = monthYear || getCurrentMonth();
    
    const userFilter = {};
    if (userId && userId !== 'family') {
      userFilter.userId = parseInt(userId);
    }

    // Get financial records
    const records = await prisma.financialRecord.findMany({
      where: { monthYear: targetMonth, ...userFilter },
      include: { category: true },
    });

    // Get loans for fixed monthly payments
    const loans = await prisma.loan.findMany({ where: userFilter });
    
    // Get debts and their payments for this month
    const debts = await prisma.debt.findMany({
      where: userFilter,
      include: {
        payments: {
          where: { monthYear: targetMonth },
        },
      },
    });

    // Calculate totals
    const summary = {
      totalIncome: 0,
      totalFixedExpenses: 0,
      totalUtilities: 0,
      totalCategoryDebts: 0,  // From category-based debts like Credit Card
      totalLoanPayments: 0,
      totalDebtPayments: 0,
      totalLoansRemaining: 0,
      totalDebtsRemaining: 0,
      netCashFlow: 0,
    };

    // From financial records
    for (const record of records) {
      const amount = record.amount || 0;
      switch (record.category.type) {
        case 'Income':
          summary.totalIncome += amount;
          break;
        case 'Fixed Expense':
          summary.totalFixedExpenses += amount;
          break;
        case 'Utility':
          summary.totalUtilities += amount;
          break;
        case 'Dynamic Debt':
        case 'Static Loan':
          // Category-based debts (like Credit Card) count as expenses
          summary.totalCategoryDebts += amount;
          break;
      }
    }

    // From loans (fixed monthly payments)
    for (const loan of loans) {
      summary.totalLoanPayments += loan.monthlyPayment || 0;
      summary.totalLoansRemaining += loan.remainingBalance || 0;
    }

    // Fetch credit limits via raw SQL
    const debtIds = debts.map(d => d.id);
    let creditLimitsMap = {};
    if (debtIds.length > 0) {
      const rawDebts = await prisma.$queryRawUnsafe(
        `SELECT id, creditLimit FROM Debt WHERE id IN (${debtIds.join(',')})`
      );
      rawDebts.forEach(d => { creditLimitsMap[d.id] = d.creditLimit || 0; });
    }

    // From debts - separate regular debts from one-time (temporary) debts
    let totalMinimumPaymentsDue = 0;
    let totalOneTimePayments = 0;
    let totalCreditLimit = 0;
    for (const debt of debts) {
      const monthPayment = debt.payments[0]?.amount || 0;
      const minimumPayment = debt.minimumPayment || 0;
      
      // Track credit limit
      totalCreditLimit += creditLimitsMap[debt.id] || 0;
      
      if (debt.isTemporary) {
        // One-time debts: full balance is due, not minimum payment
        const oneTimeAmount = debt.currentBalance || 0;
        totalOneTimePayments += oneTimeAmount;
        summary.totalDebtPayments += Math.max(monthPayment, oneTimeAmount);
      } else {
        // Regular debts: use whichever is higher - actual payment or minimum due
        const effectivePayment = Math.max(monthPayment, minimumPayment);
        summary.totalDebtPayments += effectivePayment;
        totalMinimumPaymentsDue += minimumPayment;
      }
      summary.totalDebtsRemaining += debt.currentBalance || 0;
    }
    summary.totalMinimumPaymentsDue = totalMinimumPaymentsDue;
    summary.totalOneTimePayments = totalOneTimePayments;
    summary.totalCreditLimit = totalCreditLimit;
    summary.totalCreditAvailable = totalCreditLimit - summary.totalDebtsRemaining;

    summary.netCashFlow = summary.totalIncome - 
      (summary.totalFixedExpenses + summary.totalUtilities + summary.totalCategoryDebts + summary.totalLoanPayments + summary.totalDebtPayments);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Legacy summary endpoint (for backwards compatibility)
app.get('/api/dashboard/summary-legacy', async (req, res) => {
  try {
    const { userId, monthYear } = req.query;
    const targetMonth = monthYear || getCurrentMonth();
    
    const where = { monthYear: targetMonth };
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }

    const records = await prisma.financialRecord.findMany({
      where,
      include: { category: true },
    });

    // Calculate totals by category type
    const summary = {
      totalIncome: 0,
      totalFixedExpenses: 0,
      totalUtilities: 0,
      totalDebtPayments: 0,
      netCashFlow: 0,
    };

    for (const record of records) {
      const amount = record.amount || 0;
      switch (record.category.type) {
        case 'Income':
          summary.totalIncome += amount;
          break;
        case 'Fixed Expense':
          summary.totalFixedExpenses += amount;
          break;
        case 'Utility':
          summary.totalUtilities += amount;
          break;
        case 'Static Loan':
        case 'Dynamic Debt':
          summary.totalDebtPayments += amount;
          break;
      }
    }

    summary.netCashFlow = summary.totalIncome - 
      (summary.totalFixedExpenses + summary.totalUtilities + summary.totalDebtPayments);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Get expense breakdown for Pie Chart
app.get('/api/dashboard/expense-breakdown', async (req, res) => {
  try {
    const { userId, monthYear } = req.query;
    const targetMonth = monthYear || getCurrentMonth();
    
    const userFilter = {};
    if (userId && userId !== 'family') {
      userFilter.userId = parseInt(userId);
    }

    const where = { 
      monthYear: targetMonth,
      ...userFilter,
      category: {
        type: { in: ['Fixed Expense', 'Utility', 'Dynamic Debt', 'Static Loan'] }
      }
    };

    const records = await prisma.financialRecord.findMany({
      where,
      include: { category: true },
    });

    // Aggregate by category
    const breakdown = {};
    for (const record of records) {
      const catName = record.category.name;
      if (!breakdown[catName]) {
        breakdown[catName] = { name: catName, value: 0, type: record.category.type };
      }
      breakdown[catName].value += record.amount || 0;
    }

    // Add loans (global, fixed monthly payments)
    const loans = await prisma.loan.findMany({ where: userFilter });
    for (const loan of loans) {
      if (!breakdown[loan.name]) {
        breakdown[loan.name] = { name: loan.name, value: 0, type: 'Loan' };
      }
      breakdown[loan.name].value += loan.monthlyPayment || 0;
    }

    // Add debt payments for this month
    const debts = await prisma.debt.findMany({
      where: userFilter,
      include: {
        payments: {
          where: { monthYear: targetMonth },
        },
      },
    });
    for (const debt of debts) {
      const monthPayment = debt.payments[0]?.amount || 0;
      if (monthPayment > 0) {
        if (!breakdown[debt.name]) {
          breakdown[debt.name] = { name: debt.name, value: 0, type: 'Debt' };
        }
        breakdown[debt.name].value += monthPayment;
      }
    }

    const result = Object.values(breakdown)
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    res.json(result);
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch expense breakdown' });
  }
});

// Get debt trends for Line Chart (last 12 months)
app.get('/api/dashboard/debt-trends', async (req, res) => {
  try {
    const { userId } = req.query;
    const months = getLastNMonths(12);
    
    const userFilter = {};
    if (userId && userId !== 'family') {
      userFilter.userId = parseInt(userId);
    }

    // Get loans (fixed monthly payments - same each month)
    const loans = await prisma.loan.findMany({ where: userFilter });
    const totalLoanPayment = loans.reduce((sum, loan) => sum + (loan.monthlyPayment || 0), 0);

    // Get debt payments for each month
    const debtPayments = await prisma.debtPayment.findMany({
      where: {
        monthYear: { in: months },
        debt: userFilter.userId ? { userId: userFilter.userId } : undefined,
      },
      include: { debt: true },
    });

    // Aggregate by month
    const trends = months.map(month => {
      // Loan payments are fixed each month
      const loanTotal = totalLoanPayment;
      
      // Debt payments vary by month
      const debtTotal = debtPayments
        .filter(p => p.monthYear === month)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      return {
        month,
        label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        payments: loanTotal + debtTotal,
        loanPayments: loanTotal,
        debtPayments: debtTotal,
      };
    });

    res.json(trends);
  } catch (error) {
    console.error('Error fetching debt trends:', error);
    res.status(500).json({ error: 'Failed to fetch debt trends' });
  }
});

// Get income vs expense comparison per user (for Family View)
app.get('/api/dashboard/user-comparison', async (req, res) => {
  try {
    const { monthYear } = req.query;
    const targetMonth = monthYear || getCurrentMonth();
    
    // Only get regular users (not Household system account)
    const users = await prisma.user.findMany({
      where: { isSystemAccount: false },
    });
    
    // Get records for regular users only (exclude household expenses)
    const records = await prisma.financialRecord.findMany({
      where: { 
        monthYear: targetMonth,
        user: { isSystemAccount: false },
      },
      include: { category: true },
    });

    // Get loans per user (only for regular users)
    const loans = await prisma.loan.findMany({
      where: { user: { isSystemAccount: false } },
    });
    
    // Get debt payments for this month
    const debtPayments = await prisma.debtPayment.findMany({
      where: { 
        monthYear: targetMonth,
        debt: { user: { isSystemAccount: false } },
      },
      include: { debt: true },
    });

    const comparison = users.map(user => {
      const userRecords = records.filter(r => r.userId === user.id);
      
      let income = 0;
      let expenses = 0;
      
      for (const record of userRecords) {
        if (record.category.type === 'Income') {
          income += record.amount || 0;
        } else {
          expenses += record.amount || 0;
        }
      }

      // Add loan payments for this user
      const userLoans = loans.filter(l => l.userId === user.id);
      for (const loan of userLoans) {
        expenses += loan.monthlyPayment || 0;
      }

      // Add debt payments for this user
      const userDebtPayments = debtPayments.filter(p => p.debt.userId === user.id);
      for (const payment of userDebtPayments) {
        expenses += payment.amount || 0;
      }

      return {
        name: user.name,
        income,
        expenses,
        net: income - expenses,
      };
    });

    res.json(comparison);
  } catch (error) {
    console.error('Error fetching user comparison:', error);
    res.status(500).json({ error: 'Failed to fetch user comparison' });
  }
});

// ============================================
// SMART SUGGESTION ALGORITHM
// ============================================

/**
 * Smart Suggestion API
 * 
 * Algorithm Logic:
 * 1. Calculate net cash flow (surplus) for the current month
 * 2. If surplus > 0, find the highest interest rate DEBT (not loans - they have fixed payments)
 * 3. Suggest paying extra towards that debt
 * 4. If no debts, suggest investing or saving
 * 5. Calculate impact (months saved, interest saved)
 */
app.get('/api/dashboard/smart-suggestion', async (req, res) => {
  try {
    const { userId, monthYear } = req.query;
    const targetMonth = monthYear || getCurrentMonth();
    
    const userFilter = {};
    if (userId && userId !== 'family') {
      userFilter.userId = parseInt(userId);
    }

    // Get financial records
    const records = await prisma.financialRecord.findMany({
      where: { monthYear: targetMonth, ...userFilter },
      include: { category: true },
    });

    // Get loans and debts
    const loans = await prisma.loan.findMany({ where: userFilter, include: { user: true } });
    const debts = await prisma.debt.findMany({ 
      where: userFilter, 
      include: { 
        user: true,
        payments: { where: { monthYear: targetMonth } }
      } 
    });

    // Calculate net cash flow
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const record of records) {
      if (record.category.type === 'Income') {
        totalIncome += record.amount || 0;
      } else {
        totalExpenses += record.amount || 0;
      }
    }

    // Add loan and debt payments to expenses
    for (const loan of loans) {
      totalExpenses += loan.monthlyPayment || 0;
    }
    for (const debt of debts) {
      totalExpenses += debt.payments[0]?.amount || 0;
    }

    const surplus = totalIncome - totalExpenses;

    if (surplus <= 0) {
      return res.json({
        hasSuggestion: false,
        suggestionType: 'none',
        message: 'No surplus available. Focus on reducing expenses or increasing income.',
        surplus: surplus,
      });
    }

    // Only look at DEBTS (not loans) - loans have fixed payments that can't be changed
    const payableDebts = debts
      .filter(d => d.currentBalance > 0)
      .map(d => ({
        id: d.id,
        name: d.name,
        type: 'debt',
        interestRate: d.interestRate || 0,
        remainingBalance: d.currentBalance,
        monthlyPayment: d.minimumPayment || 0,
        userName: d.user.name,
      }))
      .sort((a, b) => b.interestRate - a.interestRate);

    // If no debts to pay off, suggest investing or saving
    if (payableDebts.length === 0) {
      // Calculate potential investment growth (assuming 7% annual return)
      const annualReturn = 0.07;
      const monthlyReturn = annualReturn / 12;
      const years = 5;
      const months = years * 12;
      
      // Future value of monthly investment
      const futureValue = surplus * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
      const totalInvested = surplus * months;
      const investmentGain = futureValue - totalInvested;

      return res.json({
        hasSuggestion: true,
        suggestionType: 'invest',
        surplus: Math.round(surplus * 100) / 100,
        message: `Great news! No debts to pay off. Consider investing your ₪${surplus.toFixed(0)} surplus.`,
        investment: {
          monthlySurplus: Math.round(surplus * 100) / 100,
          projectedIn5Years: Math.round(futureValue),
          totalInvested: Math.round(totalInvested),
          projectedGain: Math.round(investmentGain),
          assumedReturn: '7% annually',
        },
        options: [
          { name: 'Emergency Fund', description: 'Build 3-6 months of expenses', priority: 1 },
          { name: 'Index Funds', description: 'Low-cost diversified investing', priority: 2 },
          { name: 'Retirement Savings', description: 'Tax-advantaged accounts', priority: 3 },
        ],
      });
    }

    // Find highest interest debt to pay off first
    const highestInterestDebt = payableDebts[0];
    
    // Calculate months to payoff without extra payment
    const monthlyRate = highestInterestDebt.interestRate / 100 / 12;
    const currentPayment = highestInterestDebt.monthlyPayment;
    const balance = highestInterestDebt.remainingBalance;
    
    let monthsWithoutExtra = 0;
    if (currentPayment > 0 && monthlyRate > 0) {
      const numerator = -Math.log(1 - (monthlyRate * balance) / currentPayment);
      const denominator = Math.log(1 + monthlyRate);
      monthsWithoutExtra = Math.ceil(numerator / denominator);
    } else if (currentPayment > 0) {
      monthsWithoutExtra = Math.ceil(balance / currentPayment);
    } else {
      monthsWithoutExtra = Math.ceil(balance / surplus); // If no min payment, use surplus
    }

    // Calculate months with extra payment (using full surplus)
    const extraPayment = Math.min(surplus, balance);
    const newPayment = (currentPayment || 0) + extraPayment;
    let monthsWithExtra = 0;
    if (newPayment > 0 && monthlyRate > 0) {
      const newNumerator = -Math.log(1 - (monthlyRate * balance) / newPayment);
      const newDenominator = Math.log(1 + monthlyRate);
      monthsWithExtra = Math.ceil(newNumerator / newDenominator);
    } else if (newPayment > 0) {
      monthsWithExtra = Math.ceil(balance / newPayment);
    }

    const monthsSaved = Math.max(0, monthsWithoutExtra - monthsWithExtra);
    
    // Estimate interest saved
    const totalInterestWithout = Math.max(0, ((currentPayment || surplus) * monthsWithoutExtra) - balance);
    const totalInterestWith = Math.max(0, (newPayment * monthsWithExtra) - balance);
    const interestSaved = Math.max(0, totalInterestWithout - totalInterestWith);

    res.json({
      hasSuggestion: true,
      suggestionType: 'payDebt',
      surplus: Math.round(surplus * 100) / 100,
      debt: {
        id: highestInterestDebt.id,
        name: highestInterestDebt.name,
        type: highestInterestDebt.type,
        interestRate: highestInterestDebt.interestRate,
        remainingBalance: highestInterestDebt.remainingBalance,
        monthlyPayment: highestInterestDebt.monthlyPayment,
        userName: highestInterestDebt.userName,
      },
      recommendation: {
        extraPayment: Math.round(extraPayment * 100) / 100,
        monthsSaved: monthsSaved,
        interestSaved: Math.round(interestSaved * 100) / 100,
        monthsToPayoff: monthsWithExtra,
      },
      message: highestInterestDebt.interestRate > 0
        ? `Pay extra ₪${extraPayment.toFixed(0)} to "${highestInterestDebt.name}" (${highestInterestDebt.interestRate}% APR) to save ${monthsSaved} months!`
        : `Pay extra ₪${extraPayment.toFixed(0)} to "${highestInterestDebt.name}" to pay it off faster!`,
    });
  } catch (error) {
    console.error('Error generating smart suggestion:', error);
    res.status(500).json({ error: 'Failed to generate smart suggestion' });
  }
});

// ============================================
// DEBT OVERVIEW (for dashboard)
// ============================================

app.get('/api/dashboard/debt-overview', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const userFilter = {};
    if (userId && userId !== 'family') {
      userFilter.userId = parseInt(userId);
    }

    // Get loans and debts from new models
    const loans = await prisma.loan.findMany({ where: userFilter, include: { user: true } });
    const debts = await prisma.debt.findMany({ where: userFilter, include: { user: true } });

    // Calculate overview
    const overview = {
      totalDebt: 0,
      totalMonthlyPayments: 0,
      loanCount: loans.length,
      debtCount: debts.length,
      highestInterestRate: 0,
      highestInterestItem: null,
      debtsByType: {
        'Loans': { count: 0, total: 0, names: [] },
        'Variable Debts': { count: 0, total: 0, names: [] },
      },
      averageInterestRate: 0,
    };

    let totalInterestRates = 0;
    let itemCount = 0;

    // Process loans
    loans.forEach(loan => {
      overview.totalDebt += loan.remainingBalance || 0;
      overview.totalMonthlyPayments += loan.monthlyPayment || 0;
      
      if (loan.interestRate > overview.highestInterestRate) {
        overview.highestInterestRate = loan.interestRate;
        overview.highestInterestItem = loan.name;
      }
      
      if (loan.interestRate > 0) {
        totalInterestRates += loan.interestRate;
        itemCount++;
      }

      overview.debtsByType['Loans'].count++;
      overview.debtsByType['Loans'].total += loan.remainingBalance || 0;
      overview.debtsByType['Loans'].names.push(loan.name);
    });

    // Process debts
    debts.forEach(debt => {
      overview.totalDebt += debt.currentBalance || 0;
      overview.totalMonthlyPayments += debt.minimumPayment || 0;
      
      if (debt.interestRate > overview.highestInterestRate) {
        overview.highestInterestRate = debt.interestRate;
        overview.highestInterestItem = debt.name;
      }
      
      if (debt.interestRate > 0) {
        totalInterestRates += debt.interestRate;
        itemCount++;
      }

      overview.debtsByType['Variable Debts'].count++;
      overview.debtsByType['Variable Debts'].total += debt.currentBalance || 0;
      overview.debtsByType['Variable Debts'].names.push(debt.name);
    });

    overview.averageInterestRate = itemCount > 0 
      ? Math.round((totalInterestRates / itemCount) * 100) / 100 
      : 0;

    res.json(overview);
  } catch (error) {
    console.error('Error fetching debt overview:', error);
    res.status(500).json({ error: 'Failed to fetch debt overview' });
  }
});

// ============================================
// MONTHLY SETUP WIZARD ENDPOINTS
// ============================================

// Get monthly setup status
app.get('/api/workflow/month-status', async (req, res) => {
  try {
    const { userId, monthYear } = req.query;
    const targetMonth = monthYear || getCurrentMonth();
    
    // Get all recurring categories
    const categories = await prisma.category.findMany({
      where: { isRecurring: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    // Get users
    const users = userId && userId !== 'family' 
      ? await prisma.user.findMany({ where: { id: parseInt(userId) } })
      : await prisma.user.findMany();

    // Get existing records for this month
    const records = await prisma.financialRecord.findMany({
      where: { 
        monthYear: targetMonth,
        userId: userId && userId !== 'family' ? parseInt(userId) : undefined,
      },
      include: { category: true },
    });

    // Determine setup status
    const staticCategories = categories.filter(c => c.isStatic);
    const dynamicCategories = categories.filter(c => !c.isStatic);

    // Count how many dynamic categories have been set (amount > 0 or has been edited)
    const recordMap = new Map();
    records.forEach(r => {
      recordMap.set(`${r.userId}-${r.categoryId}`, r);
    });

    let dynamicSetCount = 0;
    let dynamicTotalCount = 0;
    let staticSetCount = 0;
    let staticTotalCount = 0;

    users.forEach(user => {
      dynamicCategories.forEach(cat => {
        dynamicTotalCount++;
        const record = recordMap.get(`${user.id}-${cat.id}`);
        if (record && record.amount > 0) dynamicSetCount++;
      });
      
      staticCategories.forEach(cat => {
        staticTotalCount++;
        const record = recordMap.get(`${user.id}-${cat.id}`);
        if (record && record.amount > 0) staticSetCount++;
      });
    });

    const isSetup = records.length > 0;
    const dynamicProgress = dynamicTotalCount > 0 ? Math.round((dynamicSetCount / dynamicTotalCount) * 100) : 100;
    const staticProgress = staticTotalCount > 0 ? Math.round((staticSetCount / staticTotalCount) * 100) : 100;

    res.json({
      monthYear: targetMonth,
      isSetup,
      recordCount: records.length,
      dynamicCategories: dynamicCategories.length,
      staticCategories: staticCategories.length,
      dynamicSetCount,
      dynamicTotalCount,
      staticSetCount,
      staticTotalCount,
      dynamicProgress,
      staticProgress,
      overallProgress: Math.round((dynamicProgress + staticProgress) / 2),
    });
  } catch (error) {
    console.error('Error fetching month status:', error);
    res.status(500).json({ error: 'Failed to fetch month status' });
  }
});

// Get categories for setup wizard (grouped by type)
app.get('/api/workflow/setup-categories', async (req, res) => {
  try {
    const { userId, monthYear } = req.query;
    const targetMonth = monthYear || getCurrentMonth();

    // Ensure Household account exists
    await ensureHouseholdAccount();
    const householdAccount = await prisma.user.findFirst({ where: { isSystemAccount: true } });

    const categories = await prisma.category.findMany({
      where: { isRecurring: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    // Get regular users (not system accounts)
    const regularUsers = userId && userId !== 'family' 
      ? await prisma.user.findMany({ where: { id: parseInt(userId), isSystemAccount: false } })
      : await prisma.user.findMany({ where: { isSystemAccount: false } });

    // Get existing records
    const records = await prisma.financialRecord.findMany({
      where: { 
        monthYear: targetMonth,
      },
    });

    const recordMap = new Map();
    records.forEach(r => {
      recordMap.set(`${r.userId}-${r.categoryId}`, r);
    });

    // Group by static vs dynamic
    const result = {
      static: [],
      dynamic: [],
    };

    categories.forEach(cat => {
      // For household categories, use Household account
      // For individual categories, use regular users
      const usersForCategory = cat.isHousehold 
        ? [householdAccount] 
        : regularUsers;

      const categoryData = {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        isStatic: cat.isStatic,
        isHousehold: cat.isHousehold,
        defaultAmount: cat.defaultAmount,
        users: usersForCategory.map(user => {
          const record = recordMap.get(`${user.id}-${cat.id}`);
          return {
            userId: user.id,
            userName: cat.isHousehold ? 'Household' : user.name,
            amount: record?.amount ?? (cat.isStatic ? cat.defaultAmount : 0),
            recordId: record?.id,
          };
        }),
      };

      if (cat.isStatic) {
        result.static.push(categoryData);
      } else {
        result.dynamic.push(categoryData);
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching setup categories:', error);
    res.status(500).json({ error: 'Failed to fetch setup categories' });
  }
});

// Apply static payment defaults to all months going forward
app.post('/api/workflow/apply-static-defaults', async (req, res) => {
  try {
    const { categoryId, defaultAmount } = req.body;
    
    // Update category default
    await prisma.category.update({
      where: { id: parseInt(categoryId) },
      data: { defaultAmount: parseFloat(defaultAmount), isStatic: true },
    });

    res.json({ success: true, message: 'Static default updated' });
  } catch (error) {
    console.error('Error applying static defaults:', error);
    res.status(500).json({ error: 'Failed to apply static defaults' });
  }
});

// ============================================
// NEW MONTH TRANSITION LOGIC
// ============================================

/**
 * Start New Month Transaction
 * 
 * Logic:
 * 1. Get all users and recurring categories
 * 2. Try to copy from source month if records exist
 * 3. For missing user/category combinations, create with default values
 * 4. Utilities get set to 0 (variable), others copy previous or use 0
 */
app.post('/api/workflow/start-new-month', async (req, res) => {
  try {
    const { targetMonth } = req.body;
    const newMonth = targetMonth || getCurrentMonth();

    // Ensure Household account exists
    await ensureHouseholdAccount();
    const householdId = await getHouseholdAccountId();

    // Check if records already exist for the new month
    const existingRecords = await prisma.financialRecord.count({
      where: { monthYear: newMonth },
    });

    if (existingRecords > 0) {
      return res.status(400).json({
        error: 'Records already exist for this month. Use update endpoints instead.',
        existingCount: existingRecords,
      });
    }

    // Get all regular users (not system accounts)
    const users = await prisma.user.findMany({
      where: { isSystemAccount: false },
    });
    
    if (users.length === 0) {
      return res.status(400).json({
        error: 'No users found. Please add at least one user profile first.',
      });
    }

    // Get all recurring categories
    const recurringCategories = await prisma.category.findMany({
      where: { isRecurring: true },
    });

    if (recurringCategories.length === 0) {
      return res.status(400).json({
        error: 'No recurring categories found. Please add categories first.',
      });
    }

    // Create records for all user × category combinations
    // Household categories go to the Household account
    // Individual categories go to each user
    const recordsToCreate = [];
    
    for (const category of recurringCategories) {
      // Static categories use their default amount, others start at 0
      const amount = category.isStatic ? (category.defaultAmount || 0) : 0;

      if (category.isHousehold) {
        // Household category: create ONE record under Household account
        recordsToCreate.push({
          userId: householdId,
          categoryId: category.id,
          amount: amount,
          monthYear: newMonth,
          note: null,
        });
      } else {
        // Individual category: create record for each user
        for (const user of users) {
          recordsToCreate.push({
            userId: user.id,
            categoryId: category.id,
            amount: amount,
            monthYear: newMonth,
            note: null,
          });
        }
      }
    }

    // Create new records in a transaction
    const newRecords = await prisma.$transaction(
      recordsToCreate.map(record => prisma.financialRecord.create({ data: record }))
    );

    res.json({
      success: true,
      message: `Created empty month: ${formatMonthDisplay(newMonth)}`,
      newMonth,
      createdCount: newRecords.length,
    });
  } catch (error) {
    console.error('Error starting new month:', error);
    res.status(500).json({ error: 'Failed to start new month' });
  }
});

// Helper to format month for display in messages
function formatMonthDisplay(monthYear) {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Get available months
app.get('/api/workflow/months', async (req, res) => {
  try {
    const months = await prisma.financialRecord.findMany({
      select: { monthYear: true },
      distinct: ['monthYear'],
      orderBy: { monthYear: 'desc' },
    });
    
    res.json(months.map(m => m.monthYear));
  } catch (error) {
    console.error('Error fetching months:', error);
    res.status(500).json({ error: 'Failed to fetch months' });
  }
});

// ============================================
// ASSETS & INVESTMENTS ROUTES
// ============================================

// Get all assets for a user
app.get('/api/assets', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const where = { isActive: true };
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }

    const assets = await prisma.asset.findMany({
      where,
      include: { 
        user: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get asset summary/dashboard data (must be before :id route)
app.get('/api/assets/summary', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const where = { isActive: true };
    if (userId && userId !== 'family') {
      where.userId = parseInt(userId);
    }

    const assets = await prisma.asset.findMany({ where });

    // Calculate totals by type
    const summary = {
      totalValue: 0,
      totalCostBasis: 0,
      totalGainLoss: 0,
      byType: {},
    };

    for (const asset of assets) {
      summary.totalValue += asset.currentValue || 0;
      summary.totalCostBasis += asset.costBasis || 0;
      
      if (!summary.byType[asset.type]) {
        summary.byType[asset.type] = {
          count: 0,
          totalValue: 0,
          costBasis: 0,
        };
      }
      
      summary.byType[asset.type].count++;
      summary.byType[asset.type].totalValue += asset.currentValue || 0;
      summary.byType[asset.type].costBasis += asset.costBasis || 0;
    }

    summary.totalGainLoss = summary.totalValue - summary.totalCostBasis;
    summary.gainLossPercent = summary.totalCostBasis > 0 
      ? ((summary.totalGainLoss / summary.totalCostBasis) * 100).toFixed(2)
      : 0;

    res.json(summary);
  } catch (error) {
    console.error('Error fetching asset summary:', error);
    res.status(500).json({ error: 'Failed to fetch asset summary' });
  }
});

// Get single asset with full details
app.get('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: { 
        user: true,
        transactions: {
          orderBy: { date: 'desc' },
        },
        history: {
          orderBy: { monthYear: 'desc' },
          take: 12,
        },
      },
    });
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Create asset
app.post('/api/assets', async (req, res) => {
  try {
    const {
      userId,
      name,
      type,
      currentValue,
      costBasis,
      targetAmount,
      monthlyContribution,
      symbol,
      shares,
      currentPrice,
      totalUnits,
      vestedUnits,
      vestingSchedule,
      grantDate,
      vestingEndDate,
      discountPercent,
      purchasePeriodStart,
      purchasePeriodEnd,
      contributionPercent,
      institution,
      accountNumber,
      notes,
    } = req.body;

    const asset = await prisma.asset.create({
      data: {
        userId: parseInt(userId),
        name,
        type,
        currentValue: parseFloat(currentValue) || 0,
        costBasis: parseFloat(costBasis) || 0,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        symbol: symbol || null,
        shares: parseFloat(shares) || 0,
        currentPrice: currentPrice ? parseFloat(currentPrice) : null,
        totalUnits: parseFloat(totalUnits) || 0,
        vestedUnits: parseFloat(vestedUnits) || 0,
        unvestedUnits: (parseFloat(totalUnits) || 0) - (parseFloat(vestedUnits) || 0),
        vestingSchedule: vestingSchedule || null,
        grantDate: grantDate ? new Date(grantDate) : null,
        vestingEndDate: vestingEndDate ? new Date(vestingEndDate) : null,
        discountPercent: parseFloat(discountPercent) || 15,
        purchasePeriodStart: purchasePeriodStart ? new Date(purchasePeriodStart) : null,
        purchasePeriodEnd: purchasePeriodEnd ? new Date(purchasePeriodEnd) : null,
        contributionPercent: parseFloat(contributionPercent) || 0,
        institution: institution || null,
        accountNumber: accountNumber || null,
        notes: notes || null,
      },
      include: { user: true },
    });

    // Create initial value history entry
    await prisma.assetValueHistory.create({
      data: {
        assetId: asset.id,
        value: asset.currentValue,
        monthYear: getCurrentMonth(),
      },
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// Update asset
app.put('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const updateData = {};
    
    // Only include fields that are explicitly provided (not userId - use connect for relations)
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    
    // Parse numeric fields with NaN protection
    if (body.currentValue !== undefined) {
      const val = parseFloat(body.currentValue);
      updateData.currentValue = isNaN(val) ? 0 : val;
    }
    if (body.costBasis !== undefined) {
      const val = parseFloat(body.costBasis);
      updateData.costBasis = isNaN(val) ? 0 : val;
    }
    if (body.targetAmount !== undefined) {
      const val = parseFloat(body.targetAmount);
      updateData.targetAmount = (body.targetAmount === '' || body.targetAmount === null || isNaN(val)) ? null : val;
    }
    if (body.monthlyContribution !== undefined) {
      const val = parseFloat(body.monthlyContribution);
      updateData.monthlyContribution = isNaN(val) ? 0 : val;
    }
    if (body.shares !== undefined) {
      const val = parseFloat(body.shares);
      updateData.shares = isNaN(val) ? 0 : val;
    }
    if (body.currentPrice !== undefined) {
      const val = parseFloat(body.currentPrice);
      updateData.currentPrice = (body.currentPrice === '' || body.currentPrice === null || isNaN(val)) ? null : val;
    }
    if (body.totalUnits !== undefined) {
      const val = parseFloat(body.totalUnits);
      updateData.totalUnits = isNaN(val) ? 0 : val;
    }
    if (body.vestedUnits !== undefined) {
      const val = parseFloat(body.vestedUnits);
      updateData.vestedUnits = isNaN(val) ? 0 : val;
    }
    // Calculate unvested units
    if (updateData.totalUnits !== undefined || updateData.vestedUnits !== undefined) {
      const total = updateData.totalUnits ?? 0;
      const vested = updateData.vestedUnits ?? 0;
      updateData.unvestedUnits = total - vested;
    }
    if (body.discountPercent !== undefined) {
      const val = parseFloat(body.discountPercent);
      updateData.discountPercent = isNaN(val) ? 15 : val;
    }
    if (body.contributionPercent !== undefined) {
      const val = parseFloat(body.contributionPercent);
      updateData.contributionPercent = isNaN(val) ? 0 : val;
    }
    
    // String fields
    if (body.symbol !== undefined) updateData.symbol = body.symbol || null;
    if (body.institution !== undefined) updateData.institution = body.institution || null;
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.vestingSchedule !== undefined) updateData.vestingSchedule = body.vestingSchedule || null;
    
    // Parse date fields - convert empty strings to null
    if (body.grantDate !== undefined) {
      updateData.grantDate = (body.grantDate && body.grantDate !== '') ? new Date(body.grantDate) : null;
    }
    if (body.vestingEndDate !== undefined) {
      updateData.vestingEndDate = (body.vestingEndDate && body.vestingEndDate !== '') ? new Date(body.vestingEndDate) : null;
    }
    if (body.purchasePeriodStart !== undefined) {
      updateData.purchasePeriodStart = (body.purchasePeriodStart && body.purchasePeriodStart !== '') ? new Date(body.purchasePeriodStart) : null;
    }
    if (body.purchasePeriodEnd !== undefined) {
      updateData.purchasePeriodEnd = (body.purchasePeriodEnd && body.purchasePeriodEnd !== '') ? new Date(body.purchasePeriodEnd) : null;
    }

    const asset = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { user: true },
    });

    // Update value history for current month
    await prisma.assetValueHistory.upsert({
      where: {
        assetId_monthYear: {
          assetId: asset.id,
          monthYear: getCurrentMonth(),
        },
      },
      update: { value: asset.currentValue },
      create: {
        assetId: asset.id,
        value: asset.currentValue,
        monthYear: getCurrentMonth(),
      },
    });

    res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset (soft delete)
app.delete('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.asset.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Add transaction to asset
app.post('/api/assets/:id/transaction', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, units, pricePerUnit, date, note } = req.body;
    
    // Create transaction
    const transaction = await prisma.assetTransaction.create({
      data: {
        assetId: parseInt(id),
        type,
        amount: parseFloat(amount) || 0,
        units: units ? parseFloat(units) : null,
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
        date: date ? new Date(date) : new Date(),
        note: note || null,
      },
    });

    // Update asset based on transaction type
    const asset = await prisma.asset.findUnique({ where: { id: parseInt(id) } });
    if (asset) {
      const updateData = {};
      
      switch (type) {
        case 'deposit':
        case 'contribution':
          updateData.currentValue = asset.currentValue + parseFloat(amount);
          updateData.costBasis = asset.costBasis + parseFloat(amount);
          break;
        case 'withdraw':
          updateData.currentValue = Math.max(0, asset.currentValue - parseFloat(amount));
          break;
        case 'buy':
          updateData.shares = asset.shares + (parseFloat(units) || 0);
          updateData.costBasis = asset.costBasis + parseFloat(amount);
          updateData.currentValue = asset.currentValue + parseFloat(amount);
          break;
        case 'sell':
          updateData.shares = Math.max(0, asset.shares - (parseFloat(units) || 0));
          updateData.currentValue = Math.max(0, asset.currentValue - parseFloat(amount));
          break;
        case 'vest':
          updateData.vestedUnits = asset.vestedUnits + (parseFloat(units) || 0);
          updateData.unvestedUnits = Math.max(0, asset.totalUnits - updateData.vestedUnits);
          break;
        case 'dividend':
          updateData.currentValue = asset.currentValue + parseFloat(amount);
          break;
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.asset.update({
          where: { id: parseInt(id) },
          data: updateData,
        });
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  // Ensure Household system account exists
  await ensureHouseholdAccount();
  
  app.listen(PORT, () => {
    console.log(`🚀 Finance Dashboard API running on http://localhost:${PORT}`);
    console.log(`📊 Current month: ${getCurrentMonth()}`);
    console.log(`🏠 Household account ready`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

