
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batch_scan_items: {
        Row: {
          barcode: string
          batch_id: string
          category: string | null
          created_at: string
          expiration_date: string
          id: string
          image_url: string | null
          location: string | null
          notes: string | null
          product_name: string
          quantity: number | null
        }
        Insert: {
          barcode: string
          batch_id: string
          category?: string | null
          created_at?: string
          expiration_date: string
          id?: string
          image_url?: string | null
          location?: string | null
          notes?: string | null
          product_name: string
          quantity?: number | null
        }
        Update: {
          barcode?: string
          batch_id?: string
          category?: string | null
          created_at?: string
          expiration_date?: string
          id?: string
          image_url?: string | null
          location?: string | null
          notes?: string | null
          product_name?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_scan_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_scans: {
        Row: {
          batch_name: string
          completed_at: string | null
          created_at: string
          created_by_member_id: string | null
          device_id: string
          id: string
          item_count: number | null
          status: string
          store_id: string | null
        }
        Insert: {
          batch_name: string
          completed_at?: string | null
          created_at?: string
          created_by_member_id?: string | null
          device_id: string
          id?: string
          item_count?: number | null
          status?: string
          store_id?: string | null
        }
        Update: {
          batch_name?: string
          completed_at?: string | null
          created_at?: string
          created_by_member_id?: string | null
          device_id?: string
          id?: string
          item_count?: number | null
          status?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_scans_created_by_member_id_fkey"
            columns: ["created_by_member_id"]
            isOneToOne: false
            referencedRelation: "store_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_scans_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      expiry_batches: {
        Row: {
          added_at: string
          added_by_member_id: string
          barcode: string
          expiry_date: string
          id: string
          note: string | null
          quantity: number
          store_id: string
        }
        Insert: {
          added_at?: string
          added_by_member_id: string
          barcode: string
          expiry_date: string
          id?: string
          note?: string | null
          quantity: number
          store_id: string
        }
        Update: {
          added_at?: string
          added_by_member_id?: string
          barcode?: string
          expiry_date?: string
          id?: string
          note?: string | null
          quantity?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expiry_batches_added_by_member_id_fkey"
            columns: ["added_by_member_id"]
            isOneToOne: false
            referencedRelation: "store_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expiry_batches_barcode_fkey"
            columns: ["barcode"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["barcode"]
          },
          {
            foreignKeyName: "expiry_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_schedules: {
        Row: {
          created_at: string
          day_of_week: number | null
          device_id: string
          enabled: boolean | null
          id: string
          schedule_type: string
          time_of_day: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          device_id: string
          enabled?: boolean | null
          id?: string
          schedule_type: string
          time_of_day: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          device_id?: string
          enabled?: boolean | null
          id?: string
          schedule_type?: string
          time_of_day?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_schedules_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "push_tokens"
            referencedColumns: ["device_id"]
          },
        ]
      }
      product_images: {
        Row: {
          barcode: string
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          uploaded_by_member_id: string
          uploaded_by_store_id: string
        }
        Insert: {
          barcode: string
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          uploaded_by_member_id: string
          uploaded_by_store_id: string
        }
        Update: {
          barcode?: string
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          uploaded_by_member_id?: string
          uploaded_by_store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_barcode_fkey"
            columns: ["barcode"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["barcode"]
          },
          {
            foreignKeyName: "product_images_uploaded_by_member_id_fkey"
            columns: ["uploaded_by_member_id"]
            isOneToOne: false
            referencedRelation: "store_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_uploaded_by_store_id_fkey"
            columns: ["uploaded_by_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string
          created_at: string
          name: string | null
          primary_image_source_member_id: string | null
          primary_image_source_store_id: string | null
          primary_image_url: string | null
        }
        Insert: {
          barcode: string
          created_at?: string
          name?: string | null
          primary_image_source_member_id?: string | null
          primary_image_source_store_id?: string | null
          primary_image_url?: string | null
        }
        Update: {
          barcode?: string
          created_at?: string
          name?: string | null
          primary_image_source_member_id?: string | null
          primary_image_source_store_id?: string | null
          primary_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_primary_image_source_member_id_fkey"
            columns: ["primary_image_source_member_id"]
            isOneToOne: false
            referencedRelation: "store_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_primary_image_source_store_id_fkey"
            columns: ["primary_image_source_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device_id: string
          expo_push_token: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          expo_push_token: string
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          expo_push_token?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_members: {
        Row: {
          created_at: string
          device_id: string
          id: string
          nickname: string
          role: string
          store_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          nickname: string
          role: string
          store_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          nickname?: string
          role?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          name: string
          store_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          store_code: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          store_code?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
