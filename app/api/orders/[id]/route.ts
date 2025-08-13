import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body
    const orderId = Number.parseInt(params.id)

    const [updatedOrder] = await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orderId}
      RETURNING *
    `

    // Não liberar mesa automaticamente - isso será feito pelo garçom
    // quando confirmar o pagamento

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
