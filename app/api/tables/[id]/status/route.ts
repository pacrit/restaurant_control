import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)
    const body = await request.json()
    const { status, action } = body

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Validar status permitidos
    const validStatuses = ["available", "occupied", "reserved", "needs_attention", "awaiting_payment"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    let newStatus = status

    // Ações específicas
    if (action) {
      switch (action) {
        case "close_bill":
          // Marcar todos os pedidos como "awaiting_payment"
          await sql`
            UPDATE orders 
            SET status = 'awaiting_payment', updated_at = CURRENT_TIMESTAMP
            WHERE table_id = ${tableId} AND status IN ('delivered', 'ready')
          `
          newStatus = "awaiting_payment"
          break

        case "confirm_payment":
          // Marcar pedidos como pagos e liberar mesa
          await sql`
            UPDATE orders 
            SET status = 'paid', updated_at = CURRENT_TIMESTAMP
            WHERE table_id = ${tableId} AND status = 'awaiting_payment'
          `
          newStatus = "available"
          break

        case "occupy":
          newStatus = "occupied"
          break

        case "free":
          // Liberar mesa completamente
          newStatus = "available"
          break

        case "need_attention":
          newStatus = "needs_attention"
          break

        default:
          return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
      }
    }

    // Atualizar status da mesa
    const [updatedTable] = await sql`
      UPDATE tables 
      SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${tableId}
      RETURNING *
    `

    if (!updatedTable) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      table: updatedTable,
      message: getActionMessage(action, updatedTable.table_number),
    })
  } catch (error) {
    console.error("Erro ao atualizar status da mesa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

function getActionMessage(action: string, tableNumber: number): string {
  switch (action) {
    case "close_bill":
      return `Conta da Mesa ${tableNumber} fechada. Aguardando pagamento.`
    case "confirm_payment":
      return `Pagamento da Mesa ${tableNumber} confirmado. Mesa liberada.`
    case "occupy":
      return `Mesa ${tableNumber} marcada como ocupada.`
    case "free":
      return `Mesa ${tableNumber} liberada.`
    case "need_attention":
      return `Mesa ${tableNumber} precisa de atenção.`
    default:
      return `Status da Mesa ${tableNumber} atualizado.`
  }
}
