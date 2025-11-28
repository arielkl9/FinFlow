import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../hooks/useFinanceData';
import { CreditCard, TrendingDown, Percent, AlertTriangle } from 'lucide-react';

const COLORS = ['#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-xl p-3 shadow-xl">
        <p className="text-white font-medium mb-1">{data.name}</p>
        <p className="text-violet-400 font-semibold font-mono">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DebtOverviewChart({ data }) {
  // Check if there are any loans OR debts
  const totalCount = (data?.loanCount || 0) + (data?.debtCount || 0);
  
  if (!data || totalCount === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-navy-400">
        <div className="text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No loans or debts tracked</p>
          <p className="text-sm text-navy-500">Add loans in the Loans tab or debts in the Debts tab</p>
        </div>
      </div>
    );
  }

  // Prepare chart data from debtsByType (filter out empty categories)
  const chartData = Object.entries(data.debtsByType)
    .filter(([type, info]) => info.count > 0)
    .map(([type, info]) => ({
      name: type,
      value: info.total,
      count: info.count,
    }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
            <CreditCard className="w-4 h-4" />
            <span>Total Debt</span>
          </div>
          <p className="text-xl font-bold text-coral-400 font-mono">
            {formatCurrency(data.totalDebt)}
          </p>
        </div>
        
        <div className="bg-navy-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
            <TrendingDown className="w-4 h-4" />
            <span>Monthly Payments</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {formatCurrency(data.totalMonthlyPayments)}
          </p>
        </div>

        <div className="bg-navy-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
            <Percent className="w-4 h-4" />
            <span>Avg Interest</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {data.averageInterestRate}%
          </p>
        </div>

        <div className="bg-navy-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Highest Rate</span>
          </div>
          <p className={`text-xl font-bold font-mono ${data.highestInterestRate > 15 ? 'text-coral-400' : 'text-white'}`}>
            {data.highestInterestRate}%
          </p>
          {(data.highestInterestItem || data.highestInterestDebt) && (
            <p className="text-xs text-navy-500 truncate">{data.highestInterestItem || data.highestInterestDebt}</p>
          )}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="flex items-center gap-6">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="text-sm text-white">{item.name}</p>
                    <p className="text-xs text-navy-500">{item.count} debt{item.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="text-sm font-mono text-white">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

