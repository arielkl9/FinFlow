import { useState, useEffect } from 'react';
import { useFinanceData } from './hooks/useFinanceData';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './components/Dashboard/Dashboard';
import RecordsManager from './components/Records/RecordsManager';
import LoansManager from './components/Loans/LoansManager';
import VariableDebtsManager from './components/Debts/VariableDebtsManager';
import AssetsManager from './components/Assets/AssetsManager';
import StaticPaymentsManager from './components/Setup/StaticPaymentsManager';
import CategoryModal from './components/Modals/CategoryModal';
import UserModal from './components/Modals/UserModal';
import QuickAdd from './components/Common/QuickAdd';
import Onboarding from './components/Common/Onboarding';
import { ToastProvider } from './components/Common/Toast';
import MonthlySetupWizard from './components/Setup/MonthlySetupWizard';

const ONBOARDING_KEY = 'finflow_onboarding_complete';

function App() {
  const financeData = useFinanceData();
  const [activeView, setActiveView] = useState('dashboard');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [setupWizardMode, setSetupWizardMode] = useState(null); // 'household' | 'individual' | null
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if onboarding should be shown
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  function handleOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  function handleQuickAddSuccess() {
    // Trigger a refresh of the current view
    setRefreshKey(k => k + 1);
    financeData.refreshMonths();
  }

  function handleOpenSetupWizard(mode = null) {
    setSetupWizardMode(mode);
    setIsSetupWizardOpen(true);
  }

  function handleCloseSetupWizard() {
    setIsSetupWizardOpen(false);
    setSetupWizardMode(null);
  }

  if (financeData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy-300 text-lg">Loading FinFlow...</p>
        </div>
      </div>
    );
  }

  if (financeData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-coral-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-coral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-navy-300 mb-4">{financeData.error}</p>
          <p className="text-sm text-navy-400">Make sure the backend server is running on port 3001</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {/* Onboarding for first-time users */}
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      <div className="min-h-screen flex">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView}
          onOpenSettings={() => setIsCategoryModalOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation Bar */}
        <TopBar 
          users={financeData.users}
          selectedUserId={financeData.selectedUserId}
          setSelectedUserId={financeData.setSelectedUserId}
          selectedMonth={financeData.selectedMonth}
          setSelectedMonth={financeData.setSelectedMonth}
          availableMonths={financeData.availableMonths}
          refreshMonths={financeData.refreshMonths}
          onManageUsers={() => setIsUserModalOpen(true)}
          onEnterValues={handleOpenSetupWizard}
        />

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {activeView === 'dashboard' && (
              <Dashboard 
                key={`dashboard-${refreshKey}`}
                userId={financeData.selectedUserId}
                monthYear={financeData.selectedMonth}
                users={financeData.users}
                onNavigate={setActiveView}
                onEnterValues={handleOpenSetupWizard}
              />
            )}

            {activeView === 'records' && (
              <RecordsManager 
                key={`records-${refreshKey}`}
                userId={financeData.selectedUserId}
                monthYear={financeData.selectedMonth}
                users={financeData.users}
                categories={financeData.categories}
              />
            )}

            {activeView === 'assets' && (
              <AssetsManager 
                key={`assets-${refreshKey}`}
                userId={financeData.selectedUserId}
                users={financeData.users}
              />
            )}

            {activeView === 'loans' && (
              <LoansManager 
                key={`loans-${refreshKey}`}
                userId={financeData.selectedUserId}
                users={financeData.users}
              />
            )}

            {activeView === 'debts' && (
              <VariableDebtsManager 
                key={`debts-${refreshKey}`}
                userId={financeData.selectedUserId}
                users={financeData.users}
                monthYear={financeData.selectedMonth}
              />
            )}

            {activeView === 'setup' && (
              <StaticPaymentsManager 
                key={`setup-${refreshKey}`}
                categories={financeData.categories}
                onRefresh={financeData.refreshCategories}
              />
            )}
          </main>
        </div>

        {/* Quick Add Floating Button */}
        <QuickAdd 
          users={financeData.users}
          categories={financeData.categories}
          onSuccess={handleQuickAddSuccess}
        />

        {/* Category Settings Modal */}
        <CategoryModal 
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={financeData.categories}
          onRefresh={financeData.refreshCategories}
        />

      {/* User Management Modal */}
      <UserModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={financeData.users}
        onRefresh={financeData.refreshUsers}
      />

      {/* Monthly Setup Wizard */}
      <MonthlySetupWizard 
        isOpen={isSetupWizardOpen}
        onClose={handleCloseSetupWizard}
        userId={financeData.selectedUserId}
        monthYear={financeData.selectedMonth}
        mode={setupWizardMode}
        onComplete={() => {
          setRefreshKey(k => k + 1);
          financeData.refreshMonths();
        }}
      />
    </div>
  </ToastProvider>
  );
}

export default App;
