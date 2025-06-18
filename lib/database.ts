import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

// Tipos para o TypeScript
export interface Table {
  id: number
  table_number: number
  seats: number
  status: "available" | "occupied" | "reserved"
  created_at: string
}

export interface MenuCategory {
  id: number
  name: string
  description: string
  display_order: number
  created_at: string
}

export interface MenuItem {
  id: number
  category_id: number
  name: string
  description: string
  price: number | string // Allow both to handle database conversion
  image_url?: string
  available: boolean
  preparation_time: number
  created_at: string
}

export interface Order {
  id: number
  table_id: number
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  notes?: string
  created_at: string
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { menu_item: MenuItem })[]
  table: Table
}
