import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseDashboardProps {
  expenses: Expense[];
}

const COLORS = [
  'hsl(263 70% 50%)',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(210 40% 98%)',
  'hsl(250 70% 60%)',
  'hsl(142 76% 46%)',
  'hsl(38 92% 60%)',
];

export const ExpenseDashboard = ({ expenses }: ExpenseDashboardProps) => {
  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map((date) => {
      const dayExpenses = expenses.filter((exp) => exp.date === date);
      const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        amount: total,
      };
    });
  }, [expenses]);

  const monthlyData = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
    });
    return Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6);
  }, [expenses]);

  const currentMonthExpense = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return expenses
      .filter((exp) => {
        const expMonth = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return expMonth === currentMonth;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-primary border-border shadow-glow">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-primary-foreground/70">Total Expenses</p>
              <p className="text-4xl font-bold text-primary-foreground mt-2">
                ${totalExpense.toFixed(2)}
              </p>
              <p className="text-xs text-primary-foreground/60 mt-1">
                {expenses.length} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary border-border shadow-glow">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-card-foreground/70">This Month</p>
              <p className="text-4xl font-bold text-card-foreground mt-2">
                ${currentMonthExpense.toFixed(2)}
              </p>
              <p className="text-xs text-card-foreground/60 mt-1">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
              <XAxis dataKey="date" stroke="hsl(240 5% 65%)" />
              <YAxis stroke="hsl(240 5% 65%)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(240 8% 8%)', 
                  border: '1px solid hsl(240 6% 20%)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="amount" fill="hsl(263 70% 50%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {monthlyData.length > 0 && (
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                <XAxis dataKey="month" stroke="hsl(240 5% 65%)" />
                <YAxis stroke="hsl(240 5% 65%)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(240 8% 8%)', 
                    border: '1px solid hsl(240 6% 20%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="amount" fill="hsl(142 76% 36%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {categoryData.length > 0 && (
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(240 8% 8%)', 
                    border: '1px solid hsl(240 6% 20%)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
