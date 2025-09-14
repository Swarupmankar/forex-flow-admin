import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Sample data for line chart (last 30 days)
const depositWithdrawalData = [
  { date: "Jan 1", deposits: 85000, withdrawals: 62000 },
  { date: "Jan 2", deposits: 92000, withdrawals: 71000 },
  { date: "Jan 3", deposits: 78000, withdrawals: 65000 },
  { date: "Jan 4", deposits: 98000, withdrawals: 73000 },
  { date: "Jan 5", deposits: 105000, withdrawals: 82000 },
  { date: "Jan 6", deposits: 88000, withdrawals: 69000 },
  { date: "Jan 7", deposits: 110000, withdrawals: 85000 },
  { date: "Jan 8", deposits: 95000, withdrawals: 74000 },
  { date: "Jan 9", deposits: 102000, withdrawals: 79000 },
  { date: "Jan 10", deposits: 118000, withdrawals: 91000 },
  { date: "Jan 11", deposits: 87000, withdrawals: 66000 },
  { date: "Jan 12", deposits: 99000, withdrawals: 77000 },
  { date: "Jan 13", deposits: 112000, withdrawals: 86000 },
  { date: "Jan 14", deposits: 94000, withdrawals: 72000 },
  { date: "Jan 15", deposits: 107000, withdrawals: 83000 }
];

// Sample data for pie chart (account types)
const accountTypeData = [
  { name: "Standard", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Pro", value: 30, color: "hsl(var(--chart-2))" },
  { name: "Raw Spread", value: 20, color: "hsl(var(--chart-3))" },
  { name: "VIP", value: 5, color: "hsl(var(--chart-4))" }
];

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Deposits vs Withdrawals Line Chart */}
      <Card className="col-span-1 lg:col-span-2 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Daily Deposits vs Withdrawals</h3>
          <p className="text-sm text-muted-foreground">Last 15 days activity</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={depositWithdrawalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === "deposits" ? "Deposits" : "Withdrawals"
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="deposits" 
                stroke="hsl(var(--chart-deposit))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--chart-deposit))" }}
              />
              <Line 
                type="monotone" 
                dataKey="withdrawals" 
                stroke="hsl(var(--chart-withdrawal))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--chart-withdrawal))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-deposit"></div>
            <span className="text-sm text-muted-foreground">Deposits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-withdrawal"></div>
            <span className="text-sm text-muted-foreground">Withdrawals</span>
          </div>
        </div>
      </Card>

      {/* Account Types Pie Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Account Type Distribution</h3>
          <p className="text-sm text-muted-foreground">Active accounts by type</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={accountTypeData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {accountTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                formatter={(value: number) => [`${value}%`, "Percentage"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-4">
          {accountTypeData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}