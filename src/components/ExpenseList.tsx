import { useState } from 'react';
import { Trash2, Filter, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseDeleted: () => void;
}

export const ExpenseList = ({ expenses, onExpenseDeleted }: ExpenseListProps) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', category: '', description: '', date: '' });

  const filteredExpenses = expenses.filter((exp) => 
    categoryFilter === 'all' || exp.category === categoryFilter
  );

  const categories = Array.from(new Set(expenses.map((exp) => exp.category)));

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Expense deleted');
      onExpenseDeleted();
    } catch (error) {
      toast.error('Failed to delete expense');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      date: expense.date,
    });
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: parseFloat(editForm.amount),
          category: editForm.category,
          description: editForm.description || null,
          date: editForm.date,
        })
        .eq('id', editingExpense.id);

      if (error) throw error;
      toast.success('Expense updated');
      setEditingExpense(null);
      onExpenseDeleted();
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-foreground">Recent Expenses</CardTitle>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses yet. Add your first one above!
            </p>
          ) : (
            filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border hover:border-primary transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      ${expense.amount.toFixed(2)}
                    </p>
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                      {expense.category}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {expense.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(expense)}
                    className="hover:bg-primary/20 hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(expense.id)}
                    disabled={deleting === expense.id}
                    className="hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount" className="text-foreground">Amount ($)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-foreground">Category</Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-foreground">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date" className="text-foreground">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExpense} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
