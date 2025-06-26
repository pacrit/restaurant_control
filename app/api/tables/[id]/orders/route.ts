import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Buscar pedidos da mesa específica
    const orders = await sql`
      SELECT 
        o.id,
        o.table_id,
        o.status,
        o.total_amount,
        o.notes,
        o.created_at,
        o.updated_at,
        t.table_number,
        t.seats
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.table_id = ${tableId}
      ORDER BY o.created_at DESC
    `

    // Buscar itens de cada pedido
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await sql`
          SELECT 
            oi.id,
            oi.order_id,
            oi.menu_item_id,
            oi.quantity,
            oi.unit_price,
            oi.notes,
            oi.created_at,
            mi.name,
            mi.description,
            mi.price,
            mi.preparation_time
          FROM order_items oi
          LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = ${order.id}
        `

        return {
          id: order.id,
          table_id: order.table_id,
          status: order.status,
          total_amount: Number.parseFloat(order.total_amount),
          notes: order.notes,
          created_at: order.created_at,
          updated_at: order.updated_at,
          table: {
            id: order.table_id,
            table_number: order.table_number,
            seats: order.seats,
          },
          items: items.map((item) => ({
            id: item.id,
            order_id: item.order_id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: Number.parseFloat(item.unit_price),
            notes: item.notes,
            created_at: item.created_at,
            menu_item: {
              id: item.menu_item_id,
              name: item.name,
              description: item.description,
              price: Number.parseFloat(item.price),
              preparation_time: item.preparation_time,
            },
          })),
        }
      }),
    )

    return NextResponse.json(ordersWithItems)
  } catch (error) {
    console.error("Erro ao buscar pedidos da mesa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
