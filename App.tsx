import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Expense, Category, DEFAULT_CATEGORIES } from './types';
import BudgetHeader from './components/BudgetHeader';
import ExpenseManager from './components/ExpenseManager';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<{ [key: string]: number }>({});
  const [categories, setCategories] = useState<Category[]>([...DEFAULT_CATEGORIES]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBudgets({});
      setCategories([...DEFAULT_CATEGORIES]);
      return;
    }

    const expensesCol = collection(db, 'users', user.uid, 'expenses');
    const unsubscribeExpenses = onSnapshot(expensesCol, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      setExpenses(expensesData);
    });

    const userDataDocRef = doc(db, 'users', user.uid, 'userData', 'main');
    const unsubscribeUserData = onSnapshot(userDataDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBudgets(data.budgets || {});
        setCategories(data.categories || [...DEFAULT_CATEGORIES]);
      } else {
        // Se o usuário é novo, cria o documento com dados padrão
        await setDoc(userDataDocRef, { budgets: {}, categories: [...DEFAULT_CATEGORIES] });
      }
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeUserData();
    };
  }, [user]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'paidMonths'>) => {
    if (!user) return;
    const newExpense = { ...expense, paidMonths: [] };
    await addDoc(collection(db, 'users', user.uid, 'expenses'), newExpense);
  };

  const updateExpense = async (updatedExpense: Expense) => {
    if (!user) return;
    const expenseRef = doc(db, 'users', user.uid, 'expenses', updatedExpense.id);
    await setDoc(expenseRef, updatedExpense);
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
  };
  
  const addOrUpdateUserData = async (data: object) => {
      if (!user) return;
      const userDocRef = doc(db, 'users', user.uid, 'userData', 'main');
      await updateDoc(userDocRef, data);
  }

  const addCategory = useCallback(async (newCategory: string): Promise<boolean> => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !categories.some(c => c.toLowerCase() === trimmedCategory.toLowerCase())) {
        const updatedCategories = [...categories, trimmedCategory].sort();
        await addOrUpdateUserData({ categories: updatedCategories });
        return true;
    }
    return false;
  }, [categories, user]);

  const deleteCategory = useCallback(async (categoryToDelete: string): Promise<{ success: boolean; message: string }> => {
    if (DEFAULT_CATEGORIES.map(c => c.toLowerCase()).includes(categoryToDelete.toLowerCase())) {
        return { success: false, message: 'Não é possível excluir categorias padrão.' };
    }
    const isCategoryInUse = expenses.some(expense => expense.category.toLowerCase() === categoryToDelete.toLowerCase());
    if (isCategoryInUse) {
        return { success: false, message: 'Categoria em uso por uma despesa. Não pode ser excluída.' };
    }
    const updatedCategories = categories.filter(c => c.toLowerCase() !== categoryToDelete.toLowerCase());
    await addOrUpdateUserData({ categories: updatedCategories });
    return { success: true, message: 'Categoria excluída com sucesso.' };
  }, [expenses, categories, user]);

  const toggleExpensePaidStatus = useCallback(async (expenseId: string, month: string) => {
      if (!user) return;
      const expenseToUpdate = expenses.find(e => e.id === expenseId);
      if(!expenseToUpdate) return;
      
      const paidMonths = expenseToUpdate.paidMonths.includes(month)
          ? expenseToUpdate.paidMonths.filter(m => m !== month)
          : [...expenseToUpdate.paidMonths, month];

      const expenseRef = doc(db, 'users', user.uid, 'expenses', expenseId);
      await updateDoc(expenseRef, { paidMonths });
  }, [expenses, user]);

  const handleYearChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        return newDate;
    });
  };

  const handleMonthSelect = (monthIndex: number) => {
      setCurrentDate(prevDate => {
          const newDate = new Date(prevDate);
          newDate.setMonth(monthIndex);
          return newDate;
      });
  };
  
  const handleLogout = () => {
      signOut(auth).catch(error => console.error("Error signing out: ", error));
  }

  const currentMonthStr = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }, [currentDate]);

  const currentMonthBudget = useMemo(() => budgets[currentMonthStr] ?? 5000, [budgets, currentMonthStr]);

  const handleBudgetChange = useCallback(async (newBudget: number) => {
    const updatedBudgets = {
      ...budgets,
      [currentMonthStr]: newBudget >= 0 ? newBudget : 0,
    };
    await addOrUpdateUserData({ budgets: updatedBudgets });
  }, [budgets, currentMonthStr, user]);
  
  const activeExpensesForMonth = useMemo(() => {
    return expenses.filter(expense => expense.startMonth <= currentMonthStr && expense.endMonth >= currentMonthStr);
  }, [expenses, currentMonthStr]);

  const totalPaidForMonth = useMemo(() => {
    return activeExpensesForMonth
      .filter(expense => expense.paidMonths.includes(currentMonthStr))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [activeExpensesForMonth, currentMonthStr]);

  const totalPlannedForMonth = useMemo(() => activeExpensesForMonth.reduce((sum, expense) => sum + expense.amount, 0), [activeExpensesForMonth]);
  
  const monthlySummaries = useMemo(() => {
    const year = currentDate.getFullYear();
    const summaries: { [key: string]: { planned: number; budget: number } } = {};
    for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`;
        const expensesForMonth = expenses.filter(e => e.startMonth <= monthStr && e.endMonth >= monthStr);
        const planned = expensesForMonth.reduce((sum, e) => sum + e.amount, 0);
        const budget = budgets[monthStr] ?? 5000;
        summaries[monthStr] = { planned, budget };
    }
    return summaries;
  }, [expenses, budgets, currentDate]);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg text-dark-text-primary">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text-primary p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">Gerenciador de Despesas Inteligente</h1>
            <p className="text-center text-dark-text-secondary">Seu painel financeiro para clareza e controle.</p>
        </header>

        <BudgetHeader
          budget={currentMonthBudget}
          setBudget={handleBudgetChange}
          totalPaid={totalPaidForMonth}
          totalPlanned={totalPlannedForMonth}
          currentDate={currentDate}
          onYearChange={handleYearChange}
          onMonthSelect={handleMonthSelect}
          monthlySummaries={monthlySummaries}
          userEmail={user.email}
          onLogout={handleLogout}
        />

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
          <div className="lg:col-span-3">
            <ExpenseManager
              expenses={activeExpensesForMonth}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onTogglePaidStatus={toggleExpensePaidStatus}
              currentDate={currentDate}
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
            />
          </div>
          <div className="lg:col-span-2">
            <Dashboard 
              activeExpenses={activeExpensesForMonth}
              allExpenses={expenses}
              currentDate={currentDate}
              budgets={budgets}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
