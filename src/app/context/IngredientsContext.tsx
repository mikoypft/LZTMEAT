import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getIngredients, updateIngredient, type Ingredient as APIIngredient } from '@/utils/api';
import { toast } from 'sonner';

export interface Ingredient {
  id: string;
  name: string;
  code: string;
  category: string;
  stock: number;
  minStockLevel: number;
  reorderPoint: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
  expiryDate?: string | null;
}

interface IngredientsContextType {
  ingredients: Ingredient[];
  setIngredients: (ingredients: Ingredient[]) => void;
  deductIngredient: (code: string, quantity: number) => Promise<boolean>;
  adjustStock: (id: string, quantity: number, type: 'add' | 'remove', reason?: string) => Promise<void>;
}

export const IngredientsContext = createContext<IngredientsContextType | undefined>(undefined);

export function IngredientsProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const apiIngredients: APIIngredient[] = await getIngredients();
        const formattedIngredients: Ingredient[] = apiIngredients.map(apiIng => ({
          id: apiIng.id,
          name: apiIng.name,
          code: apiIng.code,
          category: apiIng.category,
          stock: apiIng.stock,
          minStockLevel: apiIng.minStockLevel,
          reorderPoint: apiIng.reorderPoint,
          unit: apiIng.unit,
          costPerUnit: apiIng.costPerUnit,
          supplier: apiIng.supplier,
          lastUpdated: apiIng.lastUpdated,
          expiryDate: apiIng.expiryDate,
        }));
        setIngredients(formattedIngredients);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        toast.error('Failed to fetch ingredients');
      }
    };

    fetchIngredients();
  }, []);

  const deductIngredient = async (code: string, quantity: number): Promise<boolean> => {
    const ingredient = ingredients.find(i => i.code === code);
    if (!ingredient) {
      console.error(`Ingredient ${code} not found`);
      return false;
    }

    if (ingredient.stock < quantity) {
      alert(`Insufficient stock for ${ingredient.name}. Available: ${ingredient.stock} ${ingredient.unit}, Required: ${quantity} ${ingredient.unit}`);
      return false;
    }

    setIngredients(prev => prev.map(ing => {
      if (ing.code === code) {
        const updatedIng = {
          ...ing,
          stock: Math.max(0, ing.stock - quantity),
          lastUpdated: new Date().toLocaleString(),
        };
        
        return updatedIng;
      }
      return ing;
    }));

    return true;
  };

  const adjustStock = async (
    id: string, 
    quantity: number, 
    type: 'add' | 'remove',
    reason?: string
  ) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const delta = type === 'add' ? quantity : -quantity;
        const updatedIng = {
          ...ing,
          stock: Math.max(0, ing.stock + delta),
          lastUpdated: new Date().toLocaleString(),
        };
        
        return updatedIng;
      }
      return ing;
    }));
  };

  return (
    <IngredientsContext.Provider value={{ ingredients, setIngredients, deductIngredient, adjustStock }}>
      {children}
    </IngredientsContext.Provider>
  );
}

export function useIngredients() {
  const context = useContext(IngredientsContext);
  if (!context) {
    throw new Error('useIngredients must be used within IngredientsProvider');
  }
  return context;
}