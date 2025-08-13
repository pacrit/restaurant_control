import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)
    const body = await request.json()
    const { action } = body

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    let newStatus = "occupied"
    let message = ""

    // Ações específicas - versão simplificada
    switch (action) {
      case "close_bill":
        // Marcar mesa como aguardando pagamento (sem alterar pedidos)
        newStatus = "awaiting_payment"
        message = `Conta da Mesa fechada. Aguardando pagamento.`
        break

      case "confirm_payment":
        // Marcar todos os pedidos como entregues e liberar mesa
        await sql`
          UPDATE orders 
          SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
          WHERE table_id = ${tableId} AND status IN ('ready', 'preparing', 'pending')
        `
        newStatus = "available"
        message = `Pagamento confirmado. Mesa liberada.`
        break

      case "occupy":
        newStatus = "occupied"
        message = `Mesa marcada como ocupada.`
        break

      case "free":
        // Liberar mesa completamente
        newStatus = "available"
        message = `Mesa liberada.`
        break

      case "need_attention":
        newStatus = "needs_attention"
        message = `Mesa precisa de atenção.`
        break

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

    // Atualizar status da mesa
    const [updatedTable] = await sql`
      UPDATE tables 
      SET status = ${newStatus}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${tableId}
      RETURNING id, table_number, status, seats, created_at, updated_at
    `

    if (!updatedTable) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      table: updatedTable,
      message: message || `Status da Mesa ${updatedTable.table_number} atualizado.`,
    })
  } catch (error) {
    console.error("Erro ao atualizar status da mesa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
