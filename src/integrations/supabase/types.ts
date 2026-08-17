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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cash_closings: {
        Row: {
          boleto_amount: number
          cash_amount: number
          closed_by: string | null
          closing_date: string
          created_at: string
          credit_amount: number
          debit_amount: number
          id: string
          notes: string | null
          opening_balance: number
          os_count: number
          other_amount: number
          pix_amount: number
          sales_count: number
          total_inflow: number
          total_outflow: number
          transfer_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          boleto_amount?: number
          cash_amount?: number
          closed_by?: string | null
          closing_date: string
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          os_count?: number
          other_amount?: number
          pix_amount?: number
          sales_count?: number
          total_inflow?: number
          total_outflow?: number
          transfer_amount?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          boleto_amount?: number
          cash_amount?: number
          closed_by?: string | null
          closing_date?: string
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          os_count?: number
          other_amount?: number
          pix_amount?: number
          sales_count?: number
          total_inflow?: number
          total_outflow?: number
          transfer_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cash_flow: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          related_order_id: string | null
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          related_order_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          related_order_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          vehicle_brand: string | null
          vehicle_mileage: number | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: string | null
          vehicles: Json
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vehicle_brand?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
          vehicles?: Json
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vehicle_brand?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
          vehicles?: Json
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          cost_type: string
          created_at: string
          description: string
          due_date: string | null
          expense_date: string
          id: string
          is_recurring: boolean
          notes: string | null
          payment_status: string
          supplier: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          cost_type?: string
          created_at?: string
          description: string
          due_date?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          payment_status?: string
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          cost_type?: string
          created_at?: string
          description?: string
          due_date?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          payment_status?: string
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          created_at: string
          current_value: number
          deadline: string | null
          id: string
          notes: string | null
          period: string
          status: string
          target_value: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          id?: string
          notes?: string | null
          period?: string
          status?: string
          target_value?: number
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          id?: string
          notes?: string | null
          period?: string
          status?: string
          target_value?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          brand: string | null
          category: string
          compatibility: Json
          created_at: string
          id: string
          location: string | null
          markup_percent: number
          max_stock: number
          min_stock: number
          model: string | null
          name: string
          notes: string | null
          origin: string
          original_code: string | null
          photos: Json
          purchase_price: number
          quantity: number
          reorder_point: number
          sale_price: number
          sku: string | null
          supplier: string | null
          turnover_class: string
          updated_at: string
          year: string | null
        }
        Insert: {
          brand?: string | null
          category?: string
          compatibility?: Json
          created_at?: string
          id?: string
          location?: string | null
          markup_percent?: number
          max_stock?: number
          min_stock?: number
          model?: string | null
          name: string
          notes?: string | null
          origin?: string
          original_code?: string | null
          photos?: Json
          purchase_price?: number
          quantity?: number
          reorder_point?: number
          sale_price?: number
          sku?: string | null
          supplier?: string | null
          turnover_class?: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          compatibility?: Json
          created_at?: string
          id?: string
          location?: string | null
          markup_percent?: number
          max_stock?: number
          min_stock?: number
          model?: string | null
          name?: string
          notes?: string | null
          origin?: string
          original_code?: string | null
          photos?: Json
          purchase_price?: number
          quantity?: number
          reorder_point?: number
          sale_price?: number
          sku?: string | null
          supplier?: string | null
          turnover_class?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          id: string
          items: Json
          notes: string | null
          payment_method: string
          total: number
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          total?: number
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          actual_hours: number | null
          approval_date: string | null
          approval_notes: string | null
          approval_status: string
          category: string
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          completion_date: string | null
          created_at: string
          diagnosis: string | null
          entry_date: string
          estimated_delivery: string | null
          estimated_hours: number | null
          feedback_comment: string | null
          feedback_date: string | null
          feedback_rating: number | null
          id: string
          labor_cost: number
          labor_price: number
          notes: string | null
          order_number: string
          parts_cost: number
          parts_price: number
          payment_method: string | null
          payment_status: string
          photos: Json
          profit: number
          selected_items: Json
          service_description: string | null
          status: string
          technician: string | null
          technician_id: string | null
          total_cost: number
          total_price: number
          updated_at: string
          vehicle_mileage: number | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: string | null
        }
        Insert: {
          actual_hours?: number | null
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string
          category?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          completion_date?: string | null
          created_at?: string
          diagnosis?: string | null
          entry_date?: string
          estimated_delivery?: string | null
          estimated_hours?: number | null
          feedback_comment?: string | null
          feedback_date?: string | null
          feedback_rating?: number | null
          id?: string
          labor_cost?: number
          labor_price?: number
          notes?: string | null
          order_number: string
          parts_cost?: number
          parts_price?: number
          payment_method?: string | null
          payment_status?: string
          photos?: Json
          profit?: number
          selected_items?: Json
          service_description?: string | null
          status?: string
          technician?: string | null
          technician_id?: string | null
          total_cost?: number
          total_price?: number
          updated_at?: string
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
        }
        Update: {
          actual_hours?: number | null
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string
          category?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          completion_date?: string | null
          created_at?: string
          diagnosis?: string | null
          entry_date?: string
          estimated_delivery?: string | null
          estimated_hours?: number | null
          feedback_comment?: string | null
          feedback_date?: string | null
          feedback_rating?: number | null
          id?: string
          labor_cost?: number
          labor_price?: number
          notes?: string | null
          order_number?: string
          parts_cost?: number
          parts_price?: number
          payment_method?: string | null
          payment_status?: string
          photos?: Json
          profit?: number
          selected_items?: Json
          service_description?: string | null
          status?: string
          technician?: string | null
          technician_id?: string | null
          total_cost?: number
          total_price?: number
          updated_at?: string
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string
          city: string | null
          contact_name: string | null
          created_at: string
          delivery_days: number | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          state: string | null
          status: string
          trade_name: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          category?: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          delivery_days?: number | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          delivery_days?: number | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      technicians: {
        Row: {
          commission_percent: number
          created_at: string
          hire_date: string | null
          hourly_rate: number
          id: string
          name: string
          notes: string | null
          phone: string | null
          salary: number
          specialty: string
          status: string
          updated_at: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          hire_date?: string | null
          hourly_rate?: number
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          salary?: number
          specialty?: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          hire_date?: string | null
          hourly_rate?: number
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          salary?: number
          specialty?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
