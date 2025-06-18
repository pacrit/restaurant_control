import { sql } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const categories = await sql`
      SELECT * FROM menu_categories 
      ORDER BY display_order, name
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
