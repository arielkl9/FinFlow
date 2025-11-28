import { useState, useEffect, useCallback } from 'react';
import { 
  userAPI, 
  categoryAPI, 
  recordAPI, 
  debtAPI, 
  dashboardAPI, 
  workflowAPI,
} from '../api';

// Get current month in YYYY-MM format
export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Format month for display
export function formatMonth(monthYear) {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Format currency (Israeli Shekels)
export function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('en-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted}₪`;
}

// Format currency with agorot
export function formatCurrencyFull(amount) {
  const formatted = new Intl.NumberFormat('en-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted}₪`;
}

// Main hook for finance data
export function useFinanceData() {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('family');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [usersData, categoriesData, monthsData] = await Promise.all([
          userAPI.getAll(),
          categoryAPI.getAll(),
          workflowAPI.getMonths(),
        ]);
        setUsers(usersData);
        setCategories(categoriesData);
        setAvailableMonths(monthsData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Refresh months
  const refreshMonths = useCallback(async () => {
    try {
      const monthsData = await workflowAPI.getMonths();
      setAvailableMonths(monthsData);
    } catch (err) {
      console.error('Failed to refresh months:', err);
    }
  }, []);

  // Refresh categories
  const refreshCategories = useCallback(async () => {
    try {
      const categoriesData = await categoryAPI.getAll();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to refresh categories:', err);
    }
  }, []);

  // Refresh users
  const refreshUsers = useCallback(async () => {
    try {
      const usersData = await userAPI.getAll();
      setUsers(usersData);
      // If currently selected user was deleted, switch to family view
      if (selectedUserId !== 'family' && !usersData.find(u => u.id === parseInt(selectedUserId))) {
        setSelectedUserId('family');
      }
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  }, [selectedUserId]);

  return {
    users,
    categories,
    selectedUserId,
    setSelectedUserId,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    refreshMonths,
    refreshCategories,
    refreshUsers,
    loading,
    error,
  };
}

// Hook for dashboard data
export function useDashboardData(userId, monthYear) {
  const [data, setData] = useState({
    summary: null,
    expenseBreakdown: [],
    debtTrends: [],
    userComparison: [],
    smartSuggestion: null,
    debtOverview: null,
    monthStatus: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const params = { monthYear };
      if (userId !== 'family') {
        params.userId = userId;
      }

      const [summary, expenseBreakdown, debtTrends, userComparison, smartSuggestion, debtOverview, monthStatus] = 
        await Promise.all([
          dashboardAPI.getSummary(params),
          dashboardAPI.getExpenseBreakdown(params),
          dashboardAPI.getDebtTrends(params),
          dashboardAPI.getUserComparison(params),
          dashboardAPI.getSmartSuggestion(params),
          dashboardAPI.getDebtOverview(params),
          workflowAPI.getMonthStatus(params),
        ]);

      setData({
        summary,
        expenseBreakdown,
        debtTrends,
        userComparison,
        smartSuggestion,
        debtOverview,
        monthStatus,
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, monthYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}

// Hook for financial records
export function useRecords(userId, monthYear) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const params = { monthYear };
      if (userId !== 'family') {
        params.userId = userId;
      }
      const data = await recordAPI.getAll(params);
      setRecords(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, monthYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveRecord = useCallback(async (record) => {
    try {
      await recordAPI.save(record);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const bulkSaveRecords = useCallback(async (recordsList) => {
    try {
      await recordAPI.bulkSave(recordsList);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  return { records, loading, error, refresh, saveRecord, bulkSaveRecords };
}

// Hook for debts
export function useDebts(userId) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (userId !== 'family') {
        params.userId = userId;
      }
      const data = await debtAPI.getAll(params);
      setDebts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDebt = useCallback(async (data) => {
    try {
      await debtAPI.create(data);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const updateDebt = useCallback(async (id, data) => {
    try {
      await debtAPI.update(id, data);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const deleteDebt = useCallback(async (id) => {
    try {
      await debtAPI.delete(id);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  return { debts, loading, error, refresh, createDebt, updateDebt, deleteDebt };
}

