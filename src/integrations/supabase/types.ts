export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          level: string
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          level?: string
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          level?: string
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          position: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          position?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          position?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cashier_shifts: {
        Row: {
          card_sales: number | null
          cash_sales: number | null
          cashier_user_id: string
          closed_at: string | null
          closing_balance: number | null
          created_at: string
          expected_balance: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_balance: number
          refunds: number | null
          status: string
          total_sales: number | null
          transaction_count: number | null
          variance: number | null
        }
        Insert: {
          card_sales?: number | null
          cash_sales?: number | null
          cashier_user_id: string
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          refunds?: number | null
          status?: string
          total_sales?: number | null
          transaction_count?: number | null
          variance?: number | null
        }
        Update: {
          card_sales?: number | null
          cash_sales?: number | null
          cashier_user_id?: string
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          refunds?: number | null
          status?: string
          total_sales?: number | null
          transaction_count?: number | null
          variance?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          position: number
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          created_at: string
          customer_id: string
          delivery_instructions: string | null
          district: string
          id: string
          is_default: boolean
          label: string
          phone: string | null
          postal_code: string | null
          recipient_name: string | null
          street: string
        }
        Insert: {
          city: string
          created_at?: string
          customer_id: string
          delivery_instructions?: string | null
          district: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          street: string
        }
        Update: {
          city?: string
          created_at?: string
          customer_id?: string
          delivery_instructions?: string | null
          district?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          customer_id: string
          id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          customer_id: string
          id?: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          alternate_phone: string | null
          average_order_value: number
          blocked_reason: string | null
          cod_rejection_count: number
          cod_rejection_rate: number
          created_at: string
          email: string | null
          id: string
          is_blocked: boolean
          last_order_date: string | null
          name: string
          order_count: number
          phone: string
          preferred_payment: string | null
          risk_score: string
          tags: string[] | null
          total_spent: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alternate_phone?: string | null
          average_order_value?: number
          blocked_reason?: string | null
          cod_rejection_count?: number
          cod_rejection_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean
          last_order_date?: string | null
          name: string
          order_count?: number
          phone: string
          preferred_payment?: string | null
          risk_score?: string
          tags?: string[] | null
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alternate_phone?: string | null
          average_order_value?: number
          blocked_reason?: string | null
          cod_rejection_count?: number
          cod_rejection_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean
          last_order_date?: string | null
          name?: string
          order_count?: number
          phone?: string
          preferred_payment?: string | null
          risk_score?: string
          tags?: string[] | null
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          configured_at: string | null
          created_at: string
          credentials: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          configured_at?: string | null
          created_at?: string
          credentials?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          configured_at?: string | null
          created_at?: string
          credentials?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          order_number: string
          order_status: string
          reseller_id: string | null
          shipping_city: string
          shipping_district: string
          shipping_email: string | null
          shipping_name: string
          shipping_phone: string
          shipping_street: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          order_number: string
          order_status?: string
          reseller_id?: string | null
          shipping_city: string
          shipping_district: string
          shipping_email?: string | null
          shipping_name: string
          shipping_phone: string
          shipping_street: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          order_number?: string
          order_status?: string
          reseller_id?: string | null
          shipping_city?: string
          shipping_district?: string
          shipping_email?: string | null
          shipping_name?: string
          shipping_phone?: string
          shipping_street?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          account_holder: string
          account_number: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_name: string
          branch: string | null
          created_at: string
          id: string
          notes: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          reseller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_name: string
          branch?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          reseller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string
          branch?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          reseller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_return_items: {
        Row: {
          created_at: string
          id: string
          original_quantity: number
          product_id: string
          product_name: string
          refund_amount: number
          return_id: string
          return_quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          original_quantity: number
          product_id: string
          product_name: string
          refund_amount: number
          return_id: string
          return_quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          original_quantity?: number
          product_id?: string
          product_name?: string
          refund_amount?: number
          return_id?: string
          return_quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "pos_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_returns: {
        Row: {
          created_at: string
          id: string
          original_receipt: string
          original_transaction_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          refund_amount: number
          refund_method: string
          rejection_reason: string | null
          return_number: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_receipt: string
          original_transaction_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          refund_amount: number
          refund_method?: string
          rejection_reason?: string | null
          return_number?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          original_receipt?: string
          original_transaction_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          refund_amount?: number
          refund_method?: string
          rejection_reason?: string | null
          return_number?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_returns_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_transaction_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          product_sku?: string | null
          quantity?: number
          total_price: number
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_transactions: {
        Row: {
          card_amount: number | null
          card_last_four: string | null
          cash_amount: number | null
          cash_received: number | null
          cashier_user_id: string
          change_given: number | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_split_payment: boolean | null
          payment_method: string
          receipt_number: string
          shift_id: string
          status: string
          subtotal: number
          total: number
          voided_at: string | null
          voided_reason: string | null
        }
        Insert: {
          card_amount?: number | null
          card_last_four?: string | null
          cash_amount?: number | null
          cash_received?: number | null
          cashier_user_id: string
          change_given?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_split_payment?: boolean | null
          payment_method?: string
          receipt_number?: string
          shift_id: string
          status?: string
          subtotal: number
          total: number
          voided_at?: string | null
          voided_reason?: string | null
        }
        Update: {
          card_amount?: number | null
          card_last_four?: string | null
          cash_amount?: number | null
          cash_received?: number | null
          cashier_user_id?: string
          change_given?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_split_payment?: boolean | null
          payment_method?: string
          receipt_number?: string
          shift_id?: string
          status?: string
          subtotal?: number
          total?: number
          voided_at?: string | null
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "cashier_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          is_bestseller: boolean
          is_new: boolean
          name: string
          original_price: number | null
          rating: number
          review_count: number
          selling_price: number
          sku: string | null
          slug: string
          status: string
          stock: number
          stock_status: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_bestseller?: boolean
          is_new?: boolean
          name: string
          original_price?: number | null
          rating?: number
          review_count?: number
          selling_price?: number
          sku?: string | null
          slug: string
          status?: string
          stock?: number
          stock_status?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_bestseller?: boolean
          is_new?: boolean
          name?: string
          original_price?: number | null
          rating?: number
          review_count?: number
          selling_price?: number
          sku?: string | null
          slug?: string
          status?: string
          stock?: number
          stock_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reseller_ledger: {
        Row: {
          balance: number
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          reference_id: string | null
          reference_number: string | null
          reseller_id: string
          type: string
        }
        Insert: {
          balance?: number
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_number?: string | null
          reseller_id: string
          type: string
        }
        Update: {
          balance?: number
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_number?: string | null
          reseller_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_ledger_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_orders: {
        Row: {
          commission_amount: number
          created_at: string
          id: string
          is_paid: boolean
          order_id: string
          paid_at: string | null
          profit: number
          reseller_id: string
          reseller_price: number
          selling_price: number
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean
          order_id: string
          paid_at?: string | null
          profit?: number
          reseller_id: string
          reseller_price?: number
          selling_price?: number
        }
        Update: {
          commission_amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean
          order_id?: string
          paid_at?: string | null
          profit?: number
          reseller_id?: string
          reseller_price?: number
          selling_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "reseller_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_orders_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          available_balance: number
          blocked_reason: string | null
          business_name: string
          business_registration: string | null
          cod_rejection_count: number
          cod_rejection_rate: number
          commission_rate: number
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          pending_balance: number
          phone: string | null
          status: string
          tax_id: string | null
          tier: string
          total_orders: number
          total_profit: number
          total_revenue: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          available_balance?: number
          blocked_reason?: string | null
          business_name: string
          business_registration?: string | null
          cod_rejection_count?: number
          cod_rejection_rate?: number
          commission_rate?: number
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          pending_balance?: number
          phone?: string | null
          status?: string
          tax_id?: string | null
          tier?: string
          total_orders?: number
          total_profit?: number
          total_revenue?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          available_balance?: number
          blocked_reason?: string | null
          business_name?: string
          business_registration?: string | null
          cod_rejection_count?: number
          cod_rejection_rate?: number
          commission_rate?: number
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          pending_balance?: number
          phone?: string | null
          status?: string
          tax_id?: string | null
          tier?: string
          total_orders?: number
          total_profit?: number
          total_revenue?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          order_number: string | null
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_number?: string | null
          priority?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_number?: string | null
          priority?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "staff"
        | "cashier"
        | "reseller"
        | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "staff",
        "cashier",
        "reseller",
        "customer",
      ],
    },
  },
} as const
