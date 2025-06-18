import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let orders

    if (status) {
      const statusList = status.split(",").map((s) => s.trim())

      orders = await sql`
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
        WHERE o.status = ANY(${statusList})
        ORDER BY o.created_at ASC
      `
    } else {
      orders = await sql`
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
        ORDER BY o.created_at DESC
      `
    }

    // Get order items for each order
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
    console.error("Erro ao buscar pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table_id, items, notes, total_amount } = body

    // Criar o pedido
    const [order] = await sql`
      INSERT INTO orders (table_id, notes, total_amount, status)
      VALUES (${table_id}, ${notes || null}, ${total_amount}, 'pending')
      RETURNING *
    `

    // Adicionar os itens do pedido
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
        VALUES (${order.id}, ${item.menu_item_id}, ${item.quantity}, ${item.unit_price}, ${item.notes || null})
      `
    }

    // Atualizar status da mesa para ocupada
    await sql`
      UPDATE tables 
      SET status = 'occupied' 
      WHERE id = ${table_id}
    `

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar pedido:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
