import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { formatCurrency } from '../../hooks/useFinanceData';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-xl p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-navy-400">{entry.name}:</span>
            <span className="font-mono font-medium" style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-navy-600">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-navy-400">Net:</span>
            <span className={`font-mono font-medium ${
              payload[0]?.payload?.net >= 0 ? 'text-emerald-400' : 'text-coral-400'
            }`}>
              {formatCurrency(payload[0]?.payload?.net || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function UserComparisonChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-navy-400">
        No user comparison data available
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#334e68" 
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#829ab1', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#829ab1', fontSize: 12 }}
            tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => <span className="text-navy-300 text-sm">{value}</span>}
          />
          <Bar 
            dataKey="income" 
            name="Income"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
          />
          <Bar 
            dataKey="expenses" 
            name="Expenses"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

