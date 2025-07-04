
export const DEFAULT_CATEGORIES = [
  'Moradia', 
  'Transporte', 
  'Alimentação', 
  'Saúde', 
  'Educação', 
  'Lazer', 
  'Contas Fixas', 
  'Investimentos',
  'Outros'
] as const;

export type Category = string;

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  dueDay: number;
  // Using YYYY-MM format for simplicity
  startMonth: string; 
  endMonth: string;
  paidMonths: string[];
}
