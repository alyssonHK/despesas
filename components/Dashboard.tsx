import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Expense, Category } from '../types';

interface DashboardProps {
  activeExpenses: Expense[];
  allExpenses: Expense[];
  currentDate: Date;
  budgets: { [key: string]: number };
}

const COLORS = ['#4f46e5', '#7c3aed', '#0ea5e9', '#10b981', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#d946ef'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        return (
            <div className="bg-dark-card p-3 rounded-lg border border-dark-border shadow-lg">
                {payload.map((pld: any, index: number) => (
                     <p key={index} style={{ color: pld.color }}>
                        {`${pld.payload && pld.payload.name ? pld.payload.name : pld.name}: ${formatter.format(pld.value)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CategoryPieChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} />
            </PieChart>
        </ResponsiveContainer>
    );
};

const MonthlyComparisonChart: React.FC<{ expenses: Expense[], currentDate: Date, budgets: { [key: string]: number } }> = ({ expenses, currentDate, budgets }) => {
    const data = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setDate(1);
            date.setMonth(currentDate.getMonth() - i);
            months.push(date);
        }

        return months.map(date => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;

            const expensesForMonth = expenses.filter(e => e.startMonth <= monthStr && e.endMonth >= monthStr);

            const totalPrevisto = expensesForMonth.reduce((sum, e) => sum + e.amount, 0);
            
            return {
                name: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
                'Orçamento': budgets[monthStr] ?? 5000,
                'Gasto Previsto': totalPrevisto,
            };
        });
    }, [expenses, currentDate, budgets]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#d1d5db" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#d1d5db" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', radius: 4 }}/>
                <Legend iconSize={10} />
                <Bar dataKey="Orçamento" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gasto Previsto" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};


const UpcomingExpenses: React.FC<{ expenses: Expense[], currentDate: Date }> = ({ expenses, currentDate }) => {
    const today = new Date().getDate();
    const isCurrentMonthView = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    const upcoming = useMemo(() => {
        if (!isCurrentMonthView) return [];
        return expenses
            .filter(e => e.dueDay >= today && !e.paidMonths.includes(currentMonthStr))
            .sort((a, b) => a.dueDay - b.dueDay)
            .slice(0, 5);
    }, [expenses, today, isCurrentMonthView, currentMonthStr]);
    
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
      <div className="space-y-3">
        {upcoming.length > 0 ? upcoming.map(expense => (
            <div key={expense.id} className="bg-dark-bg p-3 rounded-lg flex justify-between items-center">
                <div>
                    <p className="font-semibold">{expense.name}</p>
                    <p className="text-sm text-dark-text-secondary">Vence dia: {expense.dueDay}</p>
                </div>
                <p className="font-semibold text-yellow-400">{formatter.format(expense.amount)}</p>
            </div>
        )) : (
            <div className="text-center py-6 text-dark-text-secondary">
                <p>{isCurrentMonthView ? 'Nenhuma despesa futura este mês.' : 'A visualização é para meses futuros.'}</p>
            </div>
        )}
      </div>
    );
}

const Dashboard: React.FC<DashboardProps> = ({ activeExpenses, allExpenses, currentDate, budgets }) => {
  const categoryData = useMemo(() => {
    const paidExpenses = activeExpenses.filter(e => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        return e.paidMonths.includes(currentMonthStr);
    });

    const categoryMap = new Map<Category, number>();
    paidExpenses.forEach(expense => {
      categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + expense.amount);
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [activeExpenses, currentDate]);

  return (
    <div className="space-y-8">
      <div className="bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">Gastos Pagos por Categoria</h2>
        {categoryData.length > 0 ? (
            <CategoryPieChart data={categoryData} />
        ) : (
            <div className="h-[300px] flex items-center justify-center text-dark-text-secondary">
                <p>Nenhuma despesa paga para este mês.</p>
            </div>
        )}
      </div>
       <div className="bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">Histórico Mensal (Últimos 6 Meses)</h2>
        <MonthlyComparisonChart expenses={allExpenses} currentDate={currentDate} budgets={budgets} />
      </div>
      <div className="bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border">
        <h2 className="text-xl font-bold mb-4">Próximos Vencimentos</h2>
        <UpcomingExpenses expenses={activeExpenses} currentDate={currentDate} />
      </div>
    </div>
  );
};

export default Dashboard;
