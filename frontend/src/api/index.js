const API_BASE = '/api';

// Helper for fetch with error handling
async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// USER API
// ============================================

export const userAPI = {
  getAll: () => fetchAPI('/users'),
  create: (name) => fetchAPI('/users', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  delete: (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
};

// ============================================
// CATEGORY API
// ============================================

export const categoryAPI = {
  getAll: () => fetchAPI('/categories'),
  create: (data) => fetchAPI('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/categories/${id}`, { method: 'DELETE' }),
};

// ============================================
// FINANCIAL RECORDS API
// ============================================

export const recordAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/records${query ? `?${query}` : ''}`);
  },
  save: (data) => fetchAPI('/records', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  bulkSave: (records) => fetchAPI('/records/bulk', {
    method: 'POST',
    body: JSON.stringify({ records }),
  }),
  delete: (id) => fetchAPI(`/records/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids) => fetchAPI('/records/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  }),
  deleteMonth: (monthYear, userId) => {
    const query = userId && userId !== 'family' ? `?userId=${userId}` : '';
    return fetchAPI(`/records/month/${monthYear}${query}`, { method: 'DELETE' });
  },
};

// ============================================
// DEBT METADATA API
// ============================================

// Loans API (fixed monthly payments)
export const loanAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/loans${query ? `?${query}` : ''}`);
  },
  create: (data) => fetchAPI('/loans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/loans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/loans/${id}`, { method: 'DELETE' }),
};

// Variable Debts API (credit cards)
export const variableDebtAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/variable-debts${query ? `?${query}` : ''}`);
  },
  create: (data) => fetchAPI('/variable-debts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/variable-debts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/variable-debts/${id}`, { method: 'DELETE' }),
  recordPayment: (id, data) => fetchAPI(`/variable-debts/${id}/payment`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  payFull: (id, data = {}) => fetchAPI(`/variable-debts/${id}/pay-full`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPayments: (id) => fetchAPI(`/variable-debts/${id}/payments`),
  deletePayment: (debtId, paymentId, revertBalance = false) => 
    fetchAPI(`/variable-debts/${debtId}/payment/${paymentId}?revertBalance=${revertBalance}`, {
      method: 'DELETE',
    }),
  // Transaction history (update balance)
  updateBalance: (id, amount) => fetchAPI(`/variable-debts/${id}/transaction`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }),
  // Legacy transaction methods
  addTransaction: (id, data) => fetchAPI(`/variable-debts/${id}/transaction`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getTransactions: (id) => fetchAPI(`/variable-debts/${id}/transactions`),
  deleteTransaction: (debtId, transactionId, revertBalance = false) => 
    fetchAPI(`/variable-debts/${debtId}/transaction/${transactionId}?revertBalance=${revertBalance}`, {
      method: 'DELETE',
    }),
};

// Legacy debt API (keeping for backwards compatibility)
export const debtAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/debts${query ? `?${query}` : ''}`);
  },
  create: (data) => fetchAPI('/debts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/debts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/debts/${id}`, { method: 'DELETE' }),
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardAPI = {
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/dashboard/summary${query ? `?${query}` : ''}`);
  },
  getExpenseBreakdown: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/dashboard/expense-breakdown${query ? `?${query}` : ''}`);
  },
  getDebtTrends: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/dashboard/debt-trends${query ? `?${query}` : ''}`);
  },
  getUserComparison: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/dashboard/user-comparison${query ? `?${query}` : ''}`);
  },
  getSmartSuggestion: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/dashboard/smart-suggestion${query ? `?${query}` : ''}`);
  },
  getDebtOverview: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/dashboard/debt-overview${query ? `?${query}` : ''}`);
  },
};

// ============================================
// ASSETS API
// ============================================

export const assetAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/assets${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/assets/${id}`),
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/assets/summary${query ? `?${query}` : ''}`);
  },
  create: (data) => fetchAPI('/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/assets/${id}`, { method: 'DELETE' }),
  addTransaction: (id, data) => fetchAPI(`/assets/${id}/transaction`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ============================================
// WORKFLOW API
// ============================================

export const workflowAPI = {
  getMonths: () => fetchAPI('/workflow/months'),
  startNewMonth: (data = {}) => fetchAPI('/workflow/start-new-month', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMonthStatus: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/workflow/month-status${query ? `?${query}` : ''}`);
  },
  getSetupCategories: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/workflow/setup-categories${query ? `?${query}` : ''}`);
  },
  applyStaticDefaults: (data) => fetchAPI('/workflow/apply-static-defaults', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

