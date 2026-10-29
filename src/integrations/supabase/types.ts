export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          summary: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          summary?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          summary?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          end_date: string;
          end_time: string | null;
          guests: number;
          id: string;
          notes: string | null;
          payment_status: string;
          start_date: string;
          start_time: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          sub_service_id: string;
          total_amount: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          end_date: string;
          end_time?: string | null;
          guests?: number;
          id?: string;
          notes?: string | null;
          payment_status?: string;
          start_date: string;
          start_time?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          sub_service_id: string;
          total_amount?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          end_date?: string;
          end_time?: string | null;
          guests?: number;
          id?: string;
          notes?: string | null;
          payment_status?: string;
          start_date?: string;
          start_time?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          sub_service_id?: string;
          total_amount?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_sub_service_id_fkey";
            columns: ["sub_service_id"];
            isOneToOne: false;
            referencedRelation: "sub_services";
            referencedColumns: ["id"];
          },
        ];
      };
      books: {
        Row: {
          author: string;
          category: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          is_published: boolean;
          is_sample: boolean;
          isbn: string;
          price: number;
          rating: number | null;
          rating_count: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          author?: string;
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          is_published?: boolean;
          is_sample?: boolean;
          isbn?: string;
          price?: number;
          rating?: number | null;
          rating_count?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          author?: string;
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          is_published?: boolean;
          is_sample?: boolean;
          isbn?: string;
          price?: number;
          rating?: number | null;
          rating_count?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookshop_order_items: {
        Row: {
          book_id: string;
          id: string;
          order_id: string;
          quantity: number;
          title: string;
          unit_price: number;
        };
        Insert: {
          book_id: string;
          id?: string;
          order_id: string;
          quantity: number;
          title: string;
          unit_price: number;
        };
        Update: {
          book_id?: string;
          id?: string;
          order_id?: string;
          quantity?: number;
          title?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bookshop_order_items_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookshop_order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      bookshop_receipts: {
        Row: {
          amount: number;
          branch: string;
          created_at: string;
          id: string;
          method: string;
          order_id: string;
          phone: string;
          receipt_number: string;
          reference: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          branch: string;
          created_at?: string;
          id?: string;
          method?: string;
          order_id: string;
          phone: string;
          receipt_number: string;
          reference: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          branch?: string;
          created_at?: string;
          id?: string;
          method?: string;
          order_id?: string;
          phone?: string;
          receipt_number?: string;
          reference?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookshop_receipts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      bookshop_stock: {
        Row: {
          book_id: string;
          branch: string;
          is_available: boolean;
          low_stock_threshold: number;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          book_id: string;
          branch: string;
          is_available?: boolean;
          low_stock_threshold?: number;
          quantity?: number;
          updated_at?: string;
        };
        Update: {
          book_id?: string;
          branch?: string;
          is_available?: boolean;
          low_stock_threshold?: number;
          quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookshop_stock_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_enquiries: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          status: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          status?: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          status?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          admin_notes: string | null;
          amount: number;
          created_at: string;
          description: string;
          donor_email: string | null;
          donor_name: string | null;
          donor_phone: string | null;
          id: string;
          method: string;
          receipt_number: string | null;
          reference: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          amount?: number;
          created_at?: string;
          description?: string;
          donor_email?: string | null;
          donor_name?: string | null;
          donor_phone?: string | null;
          id?: string;
          method?: string;
          receipt_number?: string | null;
          reference: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          amount?: number;
          created_at?: string;
          description?: string;
          donor_email?: string | null;
          donor_name?: string | null;
          donor_phone?: string | null;
          id?: string;
          method?: string;
          receipt_number?: string | null;
          reference?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      event_tickets: {
        Row: {
          amount: number;
          attendee_name: string;
          created_at: string;
          event_id: string;
          id: string;
          method: string;
          phone: string;
          quantity: number;
          reference: string;
          ticket_number: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          attendee_name: string;
          created_at?: string;
          event_id: string;
          id?: string;
          method?: string;
          phone: string;
          quantity: number;
          reference: string;
          ticket_number: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          attendee_name?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          method?: string;
          phone?: string;
          quantity?: number;
          reference?: string;
          ticket_number?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          capacity: number | null;
          contact: string | null;
          created_at: string;
          description: string;
          end_time: string | null;
          event_date: string;
          id: string;
          is_published: boolean;
          organizer: string;
          poster_url: string | null;
          start_time: string | null;
          ticket_price: number;
          title: string;
          updated_at: string;
          venue: string;
        };
        Insert: {
          capacity?: number | null;
          contact?: string | null;
          created_at?: string;
          description?: string;
          end_time?: string | null;
          event_date: string;
          id?: string;
          is_published?: boolean;
          organizer?: string;
          poster_url?: string | null;
          start_time?: string | null;
          ticket_price?: number;
          title: string;
          updated_at?: string;
          venue?: string;
        };
        Update: {
          capacity?: number | null;
          contact?: string | null;
          created_at?: string;
          description?: string;
          end_time?: string | null;
          event_date?: string;
          id?: string;
          is_published?: boolean;
          organizer?: string;
          poster_url?: string | null;
          start_time?: string | null;
          ticket_price?: number;
          title?: string;
          updated_at?: string;
          venue?: string;
        };
        Relationships: [];
      };
      material_views: {
        Row: {
          id: string;
          material_id: string;
          user_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          user_id?: string;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_views_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          id: string;
          is_published: boolean;
          kind: string;
          title: string;
          topic: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_published?: boolean;
          kind?: string;
          title: string;
          topic?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_published?: boolean;
          kind?: string;
          title?: string;
          topic?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          audience: string;
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          user_id: string | null;
        };
        Insert: {
          audience?: string;
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          user_id?: string | null;
        };
        Update: {
          audience?: string;
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          admin_notes: string | null;
          amount: number;
          branch: string | null;
          created_at: string;
          description: string;
          id: string;
          payment_status: string;
          reference: string;
          request_id: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          amount?: number;
          branch?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          payment_status?: string;
          reference: string;
          request_id?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          amount?: number;
          branch?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          payment_status?: string;
          reference?: string;
          request_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          amount: number;
          booking_id: string;
          created_at: string;
          id: string;
          method: string;
          phone: string | null;
          receipt_number: string;
          reference: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          booking_id: string;
          created_at?: string;
          id?: string;
          method?: string;
          phone?: string | null;
          receipt_number: string;
          reference: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          booking_id?: string;
          created_at?: string;
          id?: string;
          method?: string;
          phone?: string | null;
          receipt_number?: string;
          reference?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_published: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      sub_services: {
        Row: {
          amenities: string[];
          capacity: number | null;
          created_at: string;
          description: string | null;
          details: Json;
          id: string;
          image_url: string | null;
          images: string[];
          is_available: boolean;
          is_published: boolean;
          min_notice_days: number;
          name: string;
          price: number | null;
          price_unit: string;
          service_id: string;
          updated_at: string;
        };
        Insert: {
          amenities?: string[];
          capacity?: number | null;
          created_at?: string;
          description?: string | null;
          details?: Json;
          id?: string;
          image_url?: string | null;
          images?: string[];
          is_available?: boolean;
          is_published?: boolean;
          min_notice_days?: number;
          name: string;
          price?: number | null;
          price_unit?: string;
          service_id: string;
          updated_at?: string;
        };
        Update: {
          amenities?: string[];
          capacity?: number | null;
          created_at?: string;
          description?: string | null;
          details?: Json;
          id?: string;
          image_url?: string | null;
          images?: string[];
          is_available?: boolean;
          is_published?: boolean;
          min_notice_days?: number;
          name?: string;
          price?: number | null;
          price_unit?: string;
          service_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sub_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          admin_reply: string | null;
          created_at: string;
          id: string;
          message: string;
          status: string;
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_reply?: string | null;
          created_at?: string;
          id?: string;
          message: string;
          status?: string;
          subject: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          admin_reply?: string | null;
          created_at?: string;
          id?: string;
          message?: string;
          status?: string;
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      traffic_events: {
        Row: {
          created_at: string;
          device: string;
          event_type: string;
          id: string;
          os: string;
          path: string;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          device: string;
          event_type: string;
          id?: string;
          os: string;
          path: string;
          session_id: string;
        };
        Update: {
          created_at?: string;
          device?: string;
          event_type?: string;
          id?: string;
          os?: string;
          path?: string;
          session_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bookshop_checkout: {
        Args: {
          _branch: string;
          _items: Json;
          _phone: string;
          _request_id: string;
          _success: boolean;
        };
        Returns: string;
      };
      bootstrap_super_admin: {
        Args: { _full_name: string; _user_id: string };
        Returns: boolean;
      };
      buy_event_ticket: {
        Args: {
          _attendee: string;
          _event_id: string;
          _phone: string;
          _quantity: number;
          _success: boolean;
        };
        Returns: string;
      };
      donation_receipt: {
        Args: { _id: string };
        Returns: {
          amount: number;
          created_at: string;
          description: string;
          donor_name: string;
          method: string;
          phone: string;
          receipt_number: string;
          reference: string;
        }[];
      };
      event_seats_sold: { Args: { _event_id: string }; Returns: number };
      facility_booked_ranges: {
        Args: { _sub_service_id: string };
        Returns: {
          end_date: string;
          start_date: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      notify: {
        Args: {
          _audience: string;
          _body: string;
          _link: string;
          _title: string;
          _user_id: string;
        };
        Returns: undefined;
      };
      save_bookshop_book: {
        Args: { _book: Json; _stock: Json };
        Returns: string;
      };
      simulate_donation: {
        Args: {
          _amount: number;
          _email: string;
          _message: string;
          _name: string;
          _phone: string;
          _success: boolean;
        };
        Returns: string;
      };
      simulate_payment: {
        Args: { _booking_id: string; _phone: string; _success: boolean };
        Returns: string;
      };
      super_admin_exists: { Args: never; Returns: boolean };
      track_traffic: {
        Args: {
          _device: string;
          _event_type: string;
          _os: string;
          _path: string;
          _session_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "super_admin" | "admin" | "customer";
      booking_status:
        "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "customer"],
      booking_status: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
      ],
    },
  },
} as const;
