import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, LogoutIcon } from './icons';

interface BudgetHeaderProps {
  budget: number;
  setBudget: (budget: number) => void;
  totalPaid: number;
  totalPlanned: number;
  currentDate: Date;
  onYearChange: (direction: 'prev' | 'next') => void;
  onMonthSelect: (monthIndex: number) => void;
  monthlySummaries: { [key: string]: { planned: number; budget: number } };
  userEmail: string | null;
  onLogout: () => void;
}

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-dark-card p-4 rounded-lg shadow-md flex-1 text-center h-full flex flex-col justify-center">
        <p className="text-sm text-dark-text-secondary">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);


const BudgetHeader: React.FC<BudgetHeaderProps> = ({ budget, setBudget, totalPaid, totalPlanned, currentDate, onYearChange, onMonthSelect, monthlySummaries, userEmail, onLogout }) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const remaining = budget - totalPaid;
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  useEffect(() => {
    if (isEditingBudget && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditingBudget]);

  const getMonthStatusColor = (monthIndex: number) => {
    const monthStr = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const summary = monthlySummaries[monthStr];

    if (currentMonthIndex === monthIndex) {
        return 'bg-brand-primary text-white';
    }
    if (!summary || summary.planned === 0) {
        return 'bg-dark-bg hover:bg-dark-border';
    }
    if (summary.planned > summary.budget) {
        return 'bg-orange-600/50 hover:bg-orange-500/60 text-white';
    }
    return 'bg-green-600/50 hover:bg-green-500/60 text-white';
  }

  return (
    <div className="bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border">
      <div className="flex justify-end items-center mb-4 text-sm">
        <div className='flex-grow flex justify-center items-center'>
            <button onClick={() => onYearChange('prev')} className="p-2 rounded-full hover:bg-dark-border transition-colors"><ChevronLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-xl font-semibold mx-4">{currentYear}</h2>
            <button onClick={() => onYearChange('next')} className="p-2 rounded-full hover:bg-dark-border transition-colors"><ChevronRightIcon className="w-6 h-6" /></button>
        </div>
        {userEmail && (
            <div className="flex items-center gap-3">
                <span className="text-dark-text-secondary hidden sm:inline">{userEmail}</span>
                <button onClick={onLogout} className="p-2 rounded-full hover:bg-dark-border transition-colors" aria-label="Sair">
                    <LogoutIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <button 
            key={i}
            onClick={() => onMonthSelect(i)}
            className={`p-2 rounded-md font-semibold text-sm transition-colors ${getMonthStatusColor(i)}`}
          >
            {new Date(currentYear, i).toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative group cursor-pointer" onClick={() => !isEditingBudget && setIsEditingBudget(true)}>
            <div className="bg-dark-card p-4 rounded-lg shadow-md flex-1 text-center h-full flex flex-col justify-center border border-transparent group-hover:border-blue-500/50 transition-colors">
                <p className="text-sm text-dark-text-secondary">Orçamento Total</p>
                {isEditingBudget ? (
                    <input
                        ref={inputRef}
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
                        onBlur={() => setIsEditingBudget(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        className="bg-transparent text-2xl font-bold text-blue-400 text-center w-full focus:outline-none p-0"
                    />
                ) : (
                    <p className="text-2xl font-bold text-blue-400">{formatter.format(budget)}</p>
                )}
            </div>
            {!isEditingBudget && (
                <div className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <EditIcon className="w-4 h-4 text-dark-text-secondary" />
                </div>
            )}
        </div>
        <StatCard title="Gasto Previsto" value={formatter.format(totalPlanned)} color="text-yellow-400" />
        <StatCard title="Total Pago" value={formatter.format(totalPaid)} color="text-red-400" />
        <StatCard title="Saldo (vs. Pago)" value={formatter.format(remaining)} color={remaining >= 0 ? 'text-green-400' : 'text-orange-400'} />
      </div>
    </div>
  );
};

export default BudgetHeader;