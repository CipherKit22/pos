import { supabase } from '../lib/supabase';
import { Product, Sale, SaleItem } from '../types';

export const db = {
  // --- Products ---
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_deleted', false)
      .order('name');
    if (error) throw error;
    return data as Product[];
  },

  upsertProduct: async (product: Partial<Product>) => {
    // Determine operation: if ID exists, it's an update
    const { data, error } = await supabase
      .from('products')
      .upsert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  deleteProduct: async (id: string) => {
    // Soft delete to preserve sales history
    const { error } = await supabase
      .from('products')
      .update({ is_deleted: true })
      .eq('id', id);
    if (error) throw error;
  },

  updateStock: async (items: SaleItem[]) => {
    // In a real app, this should be a stored procedure or RPC to handle concurrency
    // For this simple app, we iterate.
    for (const item of items) {
       // RPC call is better, but raw update is simpler for this scope
       const { error } = await supabase.rpc('decrement_stock', { 
         row_id: item.product_id, 
         amount: item.qty 
       });
       if (error) console.error('Stock update failed', error);
    }
  },

  // --- Sales ---
  createSale: async (sale: Omit<Sale, 'id' | 'created_at'>, items: Omit<SaleItem, 'id' | 'sale_id'>[]) => {
    // 1. Create Sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single();
    
    if (saleError) throw saleError;

    // 2. Create Sale Items
    const saleItems = items.map(item => ({
      ...item,
      sale_id: saleData.id
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    // 3. Update Stock
    await db.updateStock(saleItems as any); // Casting for simplicity

    return saleData;
  },

  getSales: async (startDate?: Date, endDate?: Date) => {
    let query = supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          product:products(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Sale[];
  },

  // --- Storage ---
  uploadImage: async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  }
};
