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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          after_json: Json | null
          before_json: Json | null
          branch_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          after_json?: Json | null
          before_json?: Json | null
          branch_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after_json?: Json | null
          before_json?: Json | null
          branch_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_menu: {
        Row: {
          branch_id: string
          is_available: boolean
          menu_item_id: string
          price_override: number | null
        }
        Insert: {
          branch_id: string
          is_available?: boolean
          menu_item_id: string
          price_override?: number | null
        }
        Update: {
          branch_id?: string
          is_available?: boolean
          menu_item_id?: string
          price_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_menu_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_menu_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          receipt_footer: string | null
          receipt_header: string | null
          service_charge_rate: number
          tax_rate: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          service_charge_rate?: number
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          service_charge_rate?: number
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      devices: {
        Row: {
          branch_id: string
          code: string
          created_at: string
          id: string
          last_sync_at: string | null
          name: string
        }
        Insert: {
          branch_id: string
          code: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          name: string
        }
        Update: {
          branch_id?: string
          code?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string
          category_id: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          payment_method: string | null
        }
        Insert: {
          amount?: number
          branch_id: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      item_modifiers: {
        Row: {
          menu_item_id: string
          modifier_group_id: string
        }
        Insert: {
          menu_item_id: string
          modifier_group_id: string
        }
        Update: {
          menu_item_id?: string
          modifier_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_modifiers_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_channel_prices: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_active: boolean
          menu_item_id: string
          price: number
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          menu_item_id: string
          price: number
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          menu_item_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_channel_prices_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sku: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sku?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sku?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_variants: {
        Row: {
          id: string
          is_default: boolean
          menu_item_id: string
          name: string
          price_delta: number
        }
        Insert: {
          id?: string
          is_default?: boolean
          menu_item_id: string
          name: string
          price_delta?: number
        }
        Update: {
          id?: string
          is_default?: boolean
          menu_item_id?: string
          name?: string
          price_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_variants_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          id: string
          is_required: boolean
          max_select: number
          min_select: number
          name: string
        }
        Insert: {
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name: string
        }
        Update: {
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name?: string
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          group_id: string
          id: string
          name: string
          price_delta: number
        }
        Insert: {
          group_id: string
          id?: string
          name: string
          price_delta?: number
        }
        Update: {
          group_id?: string
          id?: string
          name?: string
          price_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          id: string
          modifier_id: string | null
          name_snapshot: string
          order_item_id: string
          price_snapshot: number
        }
        Insert: {
          id?: string
          modifier_id?: string | null
          name_snapshot: string
          order_item_id: string
          price_snapshot?: number
        }
        Update: {
          id?: string
          modifier_id?: string | null
          name_snapshot?: string
          order_item_id?: string
          price_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          discount: number
          id: string
          line_total: number
          menu_item_id: string | null
          name_snapshot: string
          notes: string | null
          order_id: string
          qty: number
          unit_price_snapshot: number
          variant_id: string | null
        }
        Insert: {
          discount?: number
          id?: string
          line_total?: number
          menu_item_id?: string | null
          name_snapshot: string
          notes?: string | null
          order_id: string
          qty?: number
          unit_price_snapshot: number
          variant_id?: string | null
        }
        Update: {
          discount?: number
          id?: string
          line_total?: number
          menu_item_id?: string | null
          name_snapshot?: string
          notes?: string | null
          order_id?: string
          qty?: number
          unit_price_snapshot?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "menu_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          device_id: string | null
          discount_total: number
          grand_total: number
          guest_count: number
          id: string
          order_no: string
          order_type: string
          service_charge_total: number
          shift_id: string | null
          status: string
          subtotal: number
          table_id: string | null
          tax_total: number
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          branch_id: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          device_id?: string | null
          discount_total?: number
          grand_total?: number
          guest_count?: number
          id?: string
          order_no: string
          order_type?: string
          service_charge_total?: number
          shift_id?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          tax_total?: number
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          branch_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          device_id?: string | null
          discount_total?: number
          grand_total?: number
          guest_count?: number
          id?: string
          order_no?: string
          order_type?: string
          service_charge_total?: number
          shift_id?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          tax_total?: number
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          cash_received: number | null
          change_given: number | null
          id: string
          method: string
          order_id: string
          paid_at: string
          reference_no: string | null
        }
        Insert: {
          amount?: number
          cash_received?: number | null
          change_given?: number | null
          id?: string
          method: string
          order_id: string
          paid_at?: string
          reference_no?: string | null
        }
        Update: {
          amount?: number
          cash_received?: number | null
          change_given?: number | null
          id?: string
          method?: string
          order_id?: string
          paid_at?: string
          reference_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_branches: {
        Row: {
          branch_id: string
          promo_id: string
        }
        Insert: {
          branch_id: string
          promo_id: string
        }
        Update: {
          branch_id?: string
          promo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_branches_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promos"
            referencedColumns: ["id"]
          },
        ]
      }
      promos: {
        Row: {
          active_days: number[]
          active_hours_end: string | null
          active_hours_start: string | null
          created_at: string
          id: string
          is_active: boolean
          min_purchase: number
          name: string
          type: string
          valid_from: string | null
          valid_to: string | null
          value: number
        }
        Insert: {
          active_days?: number[]
          active_hours_end?: string | null
          active_hours_start?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_purchase?: number
          name: string
          type?: string
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Update: {
          active_days?: number[]
          active_hours_end?: string | null
          active_hours_start?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_purchase?: number
          name?: string
          type?: string
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Relationships: []
      }
      shifts: {
        Row: {
          branch_id: string
          closed_at: string | null
          closing_cash_counted: number | null
          closing_cash_expected: number | null
          device_id: string | null
          id: string
          notes: string | null
          opened_at: string
          opening_cash: number
          user_id: string | null
          variance: number | null
        }
        Insert: {
          branch_id: string
          closed_at?: string | null
          closing_cash_counted?: number | null
          closing_cash_expected?: number | null
          device_id?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_cash?: number
          user_id?: string | null
          variance?: number | null
        }
        Update: {
          branch_id?: string
          closed_at?: string | null
          closing_cash_counted?: number | null
          closing_cash_expected?: number | null
          device_id?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_cash?: number
          user_id?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          area: string | null
          branch_id: string
          capacity: number
          created_at: string
          id: string
          name: string
        }
        Insert: {
          area?: string | null
          branch_id: string
          capacity?: number
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          area?: string | null
          branch_id?: string
          capacity?: number
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branches: {
        Row: {
          branch_id: string
          user_id: string
        }
        Insert: {
          branch_id: string
          user_id: string
        }
        Update: {
          branch_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_branches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      report_by_branch: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_ticket: number
          branch_code: string
          branch_id: string
          branch_name: string
          gross: number
          order_count: number
          tax: number
        }[]
      }
      report_by_cashier: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          avg_ticket: number
          cashier: string
          gross: number
          order_count: number
        }[]
      }
      report_by_menu: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          gross: number
          name: string
          qty: number
        }[]
      }
      report_by_order_type: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          avg_ticket: number
          gross: number
          order_count: number
          order_type: string
        }[]
      }
      report_by_payment: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          method: string
          total: number
          trx: number
        }[]
      }
      report_channel_margin: {
        Args: { p_channel: string }
        Returns: {
          base_price: number
          category: string
          channel_price: number
          markup_pct: number
          name: string
        }[]
      }
      report_daily: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          avg_ticket: number
          day: string
          gross: number
          order_count: number
        }[]
      }
      report_expense_by_category: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          category: string
          total: number
        }[]
      }
      report_hourly: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          gross: number
          hour: number
          order_count: number
        }[]
      }
      report_menu_slow: {
        Args: {
          p_branch?: string
          p_from: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          base_price: number
          category: string
          gross: number
          name: string
          qty: number
        }[]
      }
      report_pb1: {
        Args: { p_month: string }
        Returns: {
          branch_code: string
          branch_name: string
          net_sales: number
          order_count: number
          pb1: number
          tax_rate: number
        }[]
      }
      report_profit_loss: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          discount: number
          expense_total: number
          gross: number
          net_sales: number
          profit: number
          service: number
          tax: number
        }[]
      }
      report_summary: {
        Args: { p_branch?: string; p_from: string; p_to: string }
        Returns: {
          avg_ticket: number
          discount: number
          gross: number
          net_sales: number
          order_count: number
          service: number
          tax: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
