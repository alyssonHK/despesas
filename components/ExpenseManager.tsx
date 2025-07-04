import React, { useState, useEffect, useMemo } from 'react';
import { Expense, Category, DEFAULT_CATEGORIES } from '../types';
import { PlusIcon, EditIcon, TrashIcon, XIcon, SettingsIcon, EyeIcon, EyeOffIcon } from './icons';

interface ExpenseManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'paidMonths'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onTogglePaidStatus: (expenseId: string, month: string) => void;
  currentDate: Date;
  categories: Category[];
  onAddCategory: (category: string) => Promise<boolean>;
  onDeleteCategory: (category: string) => Promise<{ success: boolean, message: string }>;
}

const AddCategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (category: string) => Promise<boolean>;
  onCategoryAdded: (category: string) => void;
}> = ({ isOpen, onClose, onAddCategory, onCategoryAdded }) => {
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCategory = newCategory.trim();
        if (await onAddCategory(trimmedCategory)) {
            onCategoryAdded(trimmedCategory);
            setNewCategory('');
            setError('');
            onClose();
        } else {
            setError('Categoria já existe ou é inválida.');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[60] p-4" aria-modal="true" role="dialog">
            <div className="bg-dark-card rounded-lg p-8 w-full max-w-md relative border border-dark-border shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-dark-text-secondary hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6">Adicionar Nova Categoria</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-category" className="block text-sm font-medium text-dark-text-secondary mb-1">Nome da Categoria</label>
                        <input
                            type="text"
                            id="new-category"
                            value={newCategory}
                            onChange={e => {
                                setNewCategory(e.target.value);
                                if (error) setError('');
                            }}
                            required
                            autoFocus
                            className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-dark-text-secondary hover:bg-dark-border mr-2 transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManageCategoriesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onDeleteCategory: (category: string) => Promise<{ success: boolean, message: string }>;
}> = ({ isOpen, onClose, categories, onDeleteCategory }) => {
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    if (!isOpen) return null;

    const customCategories = categories.filter(c => !DEFAULT_CATEGORIES.some(dc => dc.toLowerCase() === c.toLowerCase()));

    const handleDelete = async (category: string) => {
        const result = await onDeleteCategory(category);
        setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
        setTimeout(() => setFeedback(null), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[60] p-4" aria-modal="true" role="dialog">
            <div className="bg-dark-card rounded-lg p-8 w-full max-w-md relative border border-dark-border shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-dark-text-secondary hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6">Gerenciar Categorias</h2>
                {feedback && (
                    <div className={`p-3 rounded-md mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {feedback.message}
                    </div>
                )}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {customCategories.length > 0 ? customCategories.map(category => (
                        <div key={category} className="bg-dark-bg p-3 rounded-lg flex justify-between items-center group">
                            <span>{category}</span>
                            <button
                                onClick={() => handleDelete(category)}
                                className="text-dark-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Excluir categoria ${category}`}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )) : (
                        <p className="text-dark-text-secondary text-center py-4">Nenhuma categoria personalizada para gerenciar.</p>
                    )}
                </div>
                <div className="flex justify-end pt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors">Fechar</button>
                </div>
            </div>
        </div>
    );
};


const ExpenseForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id' | 'paidMonths'> | Expense) => void;
  expenseToEdit?: Expense | null;
  categories: Category[];
  onOpenAddCategory: () => void;
  onOpenManageCategories: () => void;
  preselectedCategory?: string;
}> = ({ isOpen, onClose, onSubmit, expenseToEdit, categories, onOpenAddCategory, onOpenManageCategories, preselectedCategory }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('');
  const [dueDay, setDueDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  
  useEffect(() => {
    if (!isOpen) return;

    if (preselectedCategory && categories.includes(preselectedCategory)) {
        setCategory(preselectedCategory);
    } else if (expenseToEdit) {
      setName(expenseToEdit.name);
      setAmount(String(expenseToEdit.amount));
      setCategory(expenseToEdit.category);
      setDueDay(String(expenseToEdit.dueDay));
      setStartMonth(expenseToEdit.startMonth);
      setEndMonth(expenseToEdit.endMonth);
    } else {
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      setName('');
      setAmount('');
      setCategory(categories[0] || '');
      setDueDay('10');
      setStartMonth(currentMonth);
      setEndMonth(currentMonth);
    }
  }, [expenseToEdit, isOpen, categories, preselectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = {
      name,
      amount: parseFloat(amount),
      category: category || categories[0],
      dueDay: parseInt(dueDay, 10),
      startMonth,
      endMonth,
    };
    if (expenseToEdit) {
      onSubmit({ ...expenseToEdit, ...commonData });
    } else {
      onSubmit(commonData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-dark-card rounded-lg p-8 w-full max-w-lg relative border border-dark-border shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-text-secondary hover:text-white transition-colors">
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6">{expenseToEdit ? 'Editar Despesa' : 'Adicionar Despesa'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-dark-text-secondary mb-1">Nome da Despesa</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-dark-text-secondary mb-1">Valor (R$)</label>
              <input type="number" step="0.01" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
            </div>
             <div>
              <label htmlFor="dueDay" className="block text-sm font-medium text-dark-text-secondary mb-1">Dia do Vencimento</label>
              <input type="number" min="1" max="31" id="dueDay" value={dueDay} onChange={e => setDueDay(e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-dark-text-secondary mb-1">Categoria</label>
            <div className="flex items-center gap-2">
                <select id="category" value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button type="button" onClick={onOpenAddCategory} className="p-2 bg-brand-primary hover:bg-brand-secondary rounded-md transition-colors flex-shrink-0" aria-label="Adicionar nova categoria">
                    <PlusIcon className="w-5 h-5 text-white"/>
                </button>
                <button type="button" onClick={onOpenManageCategories} className="p-2 bg-dark-bg border border-dark-border hover:bg-dark-border text-dark-text-secondary rounded-md transition-colors flex-shrink-0" aria-label="Gerenciar categorias">
                    <SettingsIcon className="w-5 h-5"/>
                </button>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startMonth" className="block text-sm font-medium text-dark-text-secondary mb-1">Mês de Início</label>
              <input type="month" id="startMonth" value={startMonth} onChange={e => setStartMonth(e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
            </div>
            <div>
              <label htmlFor="endMonth" className="block text-sm font-medium text-dark-text-secondary mb-1">Mês Final</label>
              <input type="month" id="endMonth" value={endMonth} onChange={e => setEndMonth(e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-dark-text-secondary hover:bg-dark-border mr-2 transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors">{expenseToEdit ? 'Salvar Alterações' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense, onTogglePaidStatus, currentDate, categories, onAddCategory, onDeleteCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isManageCategoryModalOpen, setIsManageCategoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>();
  const [showPaid, setShowPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const currentMonthStr = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }, [currentDate]);

  const handleOpenModalForEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setPreselectedCategory(undefined);
    setIsModalOpen(true);
  };

  const handleOpenModalForAdd = () => {
    setEditingExpense(null);
    setPreselectedCategory(undefined);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleFormSubmit = (data: Omit<Expense, 'id' | 'paidMonths'> | Expense) => {
    if ('id' in data) {
      onUpdateExpense(data);
    } else {
      onAddExpense(data);
    }
  };

  const handleCategoryAdded = (newCategory: string) => {
    setPreselectedCategory(newCategory);
    setIsAddCategoryModalOpen(false);
    // Automatically open the expense form again if it was open
    if(!isModalOpen) {
        setIsModalOpen(true);
    }
  }

  return (
    <div className="bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Despesas do Mês</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaid(showPaid === 'all' ? 'unpaid' : showPaid === 'unpaid' ? 'paid' : 'all')}
            className="p-2 rounded-md bg-dark-bg border border-dark-border hover:bg-dark-border text-dark-text-secondary transition-colors"
            title={showPaid === 'all' ? 'Mostrar apenas não pagas' : showPaid === 'unpaid' ? 'Mostrar apenas pagas' : 'Mostrar todas'}
          >
            {showPaid === 'paid' ? <EyeIcon className="w-5 h-5 text-brand-primary" /> : showPaid === 'unpaid' ? <EyeOffIcon className="w-5 h-5 text-red-400" /> : <EyeIcon className="w-5 h-5 text-dark-text-secondary opacity-50" />}
          </button>
          <button onClick={handleOpenModalForAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors">
            <PlusIcon className="w-5 h-5" />
            <span>Nova</span>
          </button>
        </div>
      </div>
      <div className="space-y-6 overflow-y-auto pr-2 flex-1">
        {expenses.length > 0 ? (
          expenses
            .filter(expense => {
              if (showPaid === 'all') return true;
              const isPaid = expense.paidMonths.includes(currentMonthStr);
              return showPaid === 'paid' ? isPaid : !isPaid;
            })
            .sort((a,b) => a.dueDay - b.dueDay)
            .map(expense => (
              <div key={expense.id} className="bg-dark-bg p-3 rounded-lg flex justify-between items-center border border-transparent hover:border-dark-border transition-colors group">
                <div className="flex items-center">
                   <input
                      type="checkbox"
                      id={`paid-${expense.id}-${currentMonthStr}`}
                      checked={expense.paidMonths.includes(currentMonthStr)}
                      onChange={() => onTogglePaidStatus(expense.id, currentMonthStr)}
                      className="h-5 w-5 rounded border-dark-border bg-dark-bg text-brand-primary focus:ring-brand-primary focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg cursor-pointer"
                    />
                  <label htmlFor={`paid-${expense.id}-${currentMonthStr}`} className="ml-4 cursor-pointer">
                    <p className={`font-semibold ${expense.paidMonths.includes(currentMonthStr) ? 'line-through text-dark-text-secondary' : ''}`}>{expense.name}</p>
                    <p className="text-sm text-dark-text-secondary">{expense.category} - {formatter.format(expense.amount)}</p>
                  </label>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModalForEdit(expense)} className="text-dark-text-secondary hover:text-blue-400 p-1"><EditIcon className="w-5 h-5" /></button>
                  <button onClick={() => onDeleteExpense(expense.id)} className="text-dark-text-secondary hover:text-red-400 p-1"><TrashIcon className="w-5 h-5" /></button>
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-10 text-dark-text-secondary">
            <p>Nenhuma despesa para este mês.</p>
            <p>Use o seletor de mês ou adicione uma nova despesa.</p>
          </div>
        )}
      </div>
      <ExpenseForm 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        expenseToEdit={editingExpense}
        categories={categories}
        onOpenAddCategory={() => setIsAddCategoryModalOpen(true)}
        onOpenManageCategories={() => setIsManageCategoryModalOpen(true)}
        preselectedCategory={preselectedCategory}
      />
       <AddCategoryModal 
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAddCategory={onAddCategory}
        onCategoryAdded={handleCategoryAdded}
      />
      <ManageCategoriesModal
        isOpen={isManageCategoryModalOpen}
        onClose={() => setIsManageCategoryModalOpen(false)}
        categories={categories}
        onDeleteCategory={onDeleteCategory}
       />
    </div>
  );
};

export default ExpenseManager;