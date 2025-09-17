import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const items = await sql`
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      ORDER BY mc.display_order, mi.name
    `

    const itemsWithNumericPrices = items.map((item) => ({
      ...item,
      price: Number.parseFloat(item.price),
    }))

    return NextResponse.json(itemsWithNumericPrices)
  } catch (error) {
    console.error("Erro ao buscar itens do menu:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category_id, name, description, price, preparation_time, available } = body

    if (!name || !price || !category_id) {
      return NextResponse.json({ error: "Nome, preço e categoria são obrigatórios" }, { status: 400 })
    }

    const [item] = await sql`
      INSERT INTO menu_items (category_id, name, description, price, preparation_time, available)
      VALUES (${category_id}, ${name}, ${description || null}, ${price}, ${preparation_time || 15}, ${available !== false})
      RETURNING *
    `

    return NextResponse.json(
      {
        ...item,
        price: Number.parseFloat(item.price),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao criar item:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
