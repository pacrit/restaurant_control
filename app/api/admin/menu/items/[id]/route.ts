import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = Number.parseInt(params.id)
    const body = await request.json()
    const { category_id, name, description, price, preparation_time, available } = body

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "ID do item inválido" }, { status: 400 })
    }

    if (!name || !price || !category_id) {
      return NextResponse.json({ error: "Nome, preço e categoria são obrigatórios" }, { status: 400 })
    }

    const [item] = await sql`
      UPDATE menu_items 
      SET category_id = ${category_id},
          name = ${name}, 
          description = ${description || null}, 
          price = ${price}, 
          preparation_time = ${preparation_time || 15},
          available = ${available !== false}
      WHERE id = ${itemId}
      RETURNING *
    `

    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ...item,
      price: Number.parseFloat(item.price),
    })
  } catch (error) {
    console.error("Erro ao atualizar item:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = Number.parseInt(params.id)

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "ID do item inválido" }, { status: 400 })
    }

    await sql`DELETE FROM menu_items WHERE id = ${itemId}`

    return NextResponse.json({ success: true, message: "Item excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir item:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
