import { sql } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const items = await sql`
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.available = true
      ORDER BY mc.display_order, mi.name
    `

    // Convert price strings to numbers
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
