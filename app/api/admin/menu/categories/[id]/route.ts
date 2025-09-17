import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryId = Number.parseInt(params.id)
    const body = await request.json()
    const { name, description, display_order } = body

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "ID da categoria inválido" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Nome da categoria é obrigatório" }, { status: 400 })
    }

    const [category] = await sql`
      UPDATE menu_categories 
      SET name = ${name}, 
          description = ${description || null}, 
          display_order = ${display_order || 0}
      WHERE id = ${categoryId}
      RETURNING *
    `

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryId = Number.parseInt(params.id)

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "ID da categoria inválido" }, { status: 400 })
    }

    // Verificar se há itens nesta categoria
    const [itemCount] = await sql`
      SELECT COUNT(*) as count FROM menu_items WHERE category_id = ${categoryId}
    `

    if (Number.parseInt(itemCount.count) > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria com itens. Mova os itens primeiro." },
        { status: 400 },
      )
    }

    await sql`DELETE FROM menu_categories WHERE id = ${categoryId}`

    return NextResponse.json({ success: true, message: "Categoria excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
