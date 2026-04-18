import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// The external DB uses a payment_method enum with values: 'cod', 'bank', 'card', 'online'
// POS UI uses 'cash', 'card', 'split' — we map accordingly
const mapPaymentMethodToDB = (method: string): string => {
  switch (method) {
    case 'cash': return 'cod';
    case 'card': return 'card';
    case 'split': return 'cod';
    default: return 'cod';
  }
};

const mapPaymentMethodFromDB = (method: string): string => {
  switch (method) {
    case 'cod': return 'cash';
    case 'card': return 'card';
    case 'bank': return 'card';
    case 'online': return 'card';
    default: return method;
  }
};

const padNumber = (value: number, size = 2) => value.toString().padStart(size, '0');

const generateReceiptNumber = () => {
  const now = new Date();
  const date = `${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}`;
  const time = `${padNumber(now.getHours())}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}${padNumber(now.getMilliseconds(), 3)}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `RCP-${date}-${time}-${random}`;
};

const isMissingColumnError = (error: { code?: string; message?: string } | null, column: string) => {
  if (!error) return false;
  return error.code === '42703' || error.message?.includes(`'${column}'`) || error.message?.includes(`.${column}`) || false;
};

const isDuplicateConstraintError = (error: { code?: string; message?: string } | null, constraint: string) => {
  if (!error) return false;
  return error.code === '23505' && (error.message?.includes(constraint) || false);
};

const normalizeShift = (row: any): CashierShift => ({
  ...row,
  cashier_user_id: row.cashier_user_id ?? row.cashier_id ?? '',
});

const normalizeTransactionItem = (row: any): POSTransactionItem => ({
  ...row,
  product_sku: row.product_sku ?? null,
  total_price: row.total_price ?? row.total ?? 0,
});

const normalizeTransaction = (row: any): POSTransaction => ({
  ...row,
  cashier_user_id: row.cashier_user_id ?? row.cashier_id ?? '',
  customer_name: row.customer_name ?? null,
  customer_phone: row.customer_phone ?? null,
  payment_method: mapPaymentMethodFromDB(row.payment_method),
  items: Array.isArray(row.items) ? row.items.map(normalizeTransactionItem) : [],
});

// =====================================================
// TYPES
// =====================================================

export interface CashierShift {
  id: string;
  cashier_user_id: string;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  variance: number | null;
  cash_sales: number;
  card_sales: number;
  total_sales: number;
  transaction_count: number;
  refunds: number;
  status: string;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export interface POSTransaction {
  id: string;
  receipt_number: string;
  shift_id: string;
  cashier_user_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  discount_type: string | null;
  discount_value: number | null;
  total: number;
  payment_method: string;
  cash_received: number | null;
  change_given: number | null;
  card_last_four: string | null;
  is_split_payment: boolean;
  cash_amount: number | null;
  card_amount: number | null;
  status: string;
  voided_reason: string | null;
  created_at: string;
  items?: POSTransactionItem[];
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_sku: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface POSReturn {
  id: string;
  return_number: string;
  original_transaction_id: string;
  original_receipt: string;
  refund_amount: number;
  reason: string;
  refund_method: string;
  status: string;
  rejection_reason: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  items?: POSReturnItem[];
  transaction?: POSTransaction;
}

export interface POSReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  product_name: string;
  original_quantity: number;
  return_quantity: number;
  unit_price: number;
  refund_amount: number;
}

// =====================================================
// CASHIER SHIFTS
// =====================================================

export function useCashierShifts() {
  return useQuery({
    queryKey: ['cashier-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashier_shifts')
        .select('*')
        .order('opened_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(normalizeShift);
    },
  });
}

export function useActiveShift() {
  return useQuery({
    queryKey: ['active-shift'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let { data, error } = await supabase
        .from('cashier_shifts')
        .select('*')
        .eq('cashier_user_id', user.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isMissingColumnError(error, 'cashier_user_id')) {
        const fallback = await (supabase as any)
          .from('cashier_shifts')
          .select('*')
          .eq('cashier_id', user.id)
          .eq('status', 'open')
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      return data ? normalizeShift(data) : null;
    },
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ openingBalance }: { openingBalance: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let { data, error } = await supabase
        .from('cashier_shifts')
        .insert({
          cashier_user_id: user.id,
          opening_balance: openingBalance,
          status: 'open',
        } as any)
        .select()
        .single();

      if (isMissingColumnError(error, 'cashier_user_id')) {
        const fallback = await (supabase as any)
          .from('cashier_shifts')
          .insert({
            cashier_id: user.id,
            opening_balance: openingBalance,
            status: 'open',
          })
          .select()
          .single();

        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      return normalizeShift(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      toast.success('Shift opened successfully');
    },
    onError: (error) => {
      toast.error('Failed to open shift: ' + error.message);
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, closingBalance, notes }: { shiftId: string; closingBalance: number; notes?: string }) => {
      // Fetch current shift to calculate expected balance
      const { data: shift, error: fetchError } = await supabase
        .from('cashier_shifts')
        .select('*')
        .eq('id', shiftId)
        .single();

      if (fetchError) throw fetchError;

      const expectedBalance = shift.opening_balance + shift.cash_sales - shift.refunds;
      const variance = closingBalance - expectedBalance;

      const { data, error } = await supabase
        .from('cashier_shifts')
        .update({
          closing_balance: closingBalance,
          expected_balance: expectedBalance,
          variance,
          status: 'closed',
          closed_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      toast.success('Shift closed successfully');
    },
    onError: (error) => {
      toast.error('Failed to close shift: ' + error.message);
    },
  });
}

// =====================================================
// POS TRANSACTIONS
// =====================================================

export function usePOSTransactions(options?: { status?: string; paymentMethod?: string }) {
  return useQuery({
    queryKey: ['pos-transactions', options],
    queryFn: async () => {
      let query = supabase
        .from('pos_transactions')
        .select(`*, items:pos_transaction_items(*)`)
        .order('created_at', { ascending: false });

      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }
      if (options?.paymentMethod && options.paymentMethod !== 'all') {
        query = query.eq('payment_method', mapPaymentMethodToDB(options.paymentMethod));
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(normalizeTransaction);
    },
  });
}

export function useCreatePOSTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shiftId,
      customerName,
      customerPhone,
      subtotal,
      discount,
      discountType,
      discountValue,
      total,
      paymentMethod,
      cashReceived,
      changeGiven,
      isSplitPayment,
      cashAmount,
      cardAmount,
      items,
    }: {
      shiftId: string;
      customerName?: string;
      customerPhone?: string;
      subtotal: number;
      discount: number;
      discountType?: string;
      discountValue?: number;
      total: number;
      paymentMethod: string;
      cashReceived?: number;
      changeGiven?: number;
      isSplitPayment?: boolean;
      cashAmount?: number;
      cardAmount?: number;
      items: { productId: string; productSku: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let txn: any = null;
      let txnError: any = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const receiptNumber = generateReceiptNumber();

        const primaryInsert = await supabase
          .from('pos_transactions')
          .insert({
            receipt_number: receiptNumber,
            shift_id: shiftId,
            cashier_user_id: user.id,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            subtotal,
            discount,
            discount_type: discountType || null,
            discount_value: discountValue || null,
            total,
            payment_method: mapPaymentMethodToDB(paymentMethod),
            cash_received: cashReceived || null,
            change_given: changeGiven || null,
            is_split_payment: isSplitPayment || false,
            cash_amount: cashAmount || null,
            card_amount: cardAmount || null,
            status: 'completed',
          } as any)
          .select()
          .single();

        txn = primaryInsert.data;
        txnError = primaryInsert.error;

        if (isMissingColumnError(txnError, 'cashier_user_id')) {
          const fallback = await (supabase as any)
            .from('pos_transactions')
            .insert({
              receipt_number: receiptNumber,
              shift_id: shiftId,
              cashier_id: user.id,
              customer_id: null,
              order_id: null,
              subtotal,
              discount,
              discount_type: discountType || null,
              discount_value: discountValue || null,
              tax: 0,
              total,
              payment_method: mapPaymentMethodToDB(paymentMethod),
              cash_received: cashReceived || null,
              change_given: changeGiven || null,
              card_last_four: null,
              is_split_payment: isSplitPayment || false,
              cash_amount: cashAmount || null,
              card_amount: cardAmount || null,
              status: 'completed',
            })
            .select()
            .single();

          txn = fallback.data;
          txnError = fallback.error;
        }

        if (!isDuplicateConstraintError(txnError, 'pos_transactions_receipt_number_key')) {
          break;
        }
      }

      if (txnError) throw txnError;

      if (items.length > 0) {
        const txnItems = items.map(item => ({
          transaction_id: txn.id,
          product_id: item.productId,
          product_sku: item.productSku,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        }));

        let { error: itemsError } = await supabase
          .from('pos_transaction_items')
          .insert(txnItems as any);

        if (isMissingColumnError(itemsError, 'total_price')) {
          const fallbackItems = items.map(item => ({
            transaction_id: txn.id,
            product_id: item.productId,
            product_sku: item.productSku,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: 0,
            total: item.totalPrice,
          }));

          const fallback = await (supabase as any)
            .from('pos_transaction_items')
            .insert(fallbackItems);

          itemsError = fallback.error;
        }

        if (itemsError) throw itemsError;
      }

      return normalizeTransaction(txn);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] });
    },
    onError: (error) => {
      toast.error('Failed to process sale: ' + error.message);
    },
  });
}

// =====================================================
// POS RETURNS
// =====================================================

export function usePOSReturns(options?: { status?: string }) {
  return useQuery({
    queryKey: ['pos-returns', options],
    queryFn: async () => {
      let query = supabase
        .from('pos_returns')
        .select(`*, items:pos_return_items(*)`)
        .order('created_at', { ascending: false });

      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as POSReturn[];
    },
  });
}

export function useCreatePOSReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalTransactionId,
      originalReceipt,
      shiftId,
      refundAmount,
      reason,
      refundMethod,
      items,
    }: {
      originalTransactionId: string;
      originalReceipt: string;
      shiftId: string;
      refundAmount: number;
      reason: string;
      refundMethod: string;
      items: { productId: string; productName: string; originalQuantity: number; returnQuantity: number; unitPrice: number; refundAmount: number }[];
    }) => {
      // Always include shift_id — the external DB requires it (NOT NULL)
      let { data: ret, error: retError } = await supabase
        .from('pos_returns')
        .insert({
          original_transaction_id: originalTransactionId,
          original_receipt: originalReceipt,
          shift_id: shiftId,
          refund_amount: refundAmount,
          reason,
          refund_method: refundMethod,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (retError) throw retError;

      if (items.length > 0) {
        const retItems = items.map(item => ({
          return_id: ret.id,
          product_id: item.productId,
          product_name: item.productName,
          original_quantity: item.originalQuantity,
          return_quantity: item.returnQuantity,
          unit_price: item.unitPrice,
          refund_amount: item.refundAmount,
        }));

        const { error: itemsError } = await supabase
          .from('pos_return_items')
          .insert(retItems);

        if (itemsError) throw itemsError;
      }

      return ret;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-returns'] });
      toast.success('Return created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create return: ' + error.message);
    },
  });
}

export function useProcessPOSReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, action, rejectionReason }: { returnId: string; action: 'approve' | 'reject'; rejectionReason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: Record<string, any> = {
        status: action === 'approve' ? 'completed' : 'rejected',
        processed_by: user?.id || null,
        processed_at: new Date().toISOString(),
      };

      if (action === 'reject' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data, error } = await supabase
        .from('pos_returns')
        .update(updateData)
        .eq('id', returnId)
        .select()
        .single();

      if (error) throw error;

      // If approved, restore stock for returned items
      if (action === 'approve') {
        const { data: returnItems } = await supabase
          .from('pos_return_items')
          .select('*')
          .eq('return_id', returnId);

        if (returnItems) {
          for (const item of returnItems) {
            await supabase
              .from('products')
              .update({ 
                stock: supabase.rpc ? undefined : undefined // Will handle via raw update
              })
              .eq('id', item.product_id);

            // Simple stock restoration
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();

            if (product) {
              const newStock = product.stock + item.return_quantity;
              await supabase
                .from('products')
                .update({ 
                  stock: newStock,
                  stock_status: newStock > 5 ? 'in-stock' : newStock > 0 ? 'low-stock' : 'out-of-stock',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.product_id);
            }
          }
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pos-returns'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      toast.success(variables.action === 'approve' ? 'Return approved' : 'Return rejected');
    },
    onError: (error) => {
      toast.error('Failed to process return: ' + error.message);
    },
  });
}
