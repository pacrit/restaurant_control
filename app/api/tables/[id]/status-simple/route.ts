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

    switch (action) {
      case "close_bill":
        // Marcar TODOS os pedidos como entregues e limpar a mesa
        try {
          await sql`
            UPDATE orders 
            SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
            WHERE table_id = ${tableId} AND status IN ('ready', 'preparing', 'pending')
          `

          // Limpar token de acesso para forçar nova autenticação
          await sql`
            UPDATE tables 
            SET access_token = NULL, token_expires_at = NULL
            WHERE id = ${tableId}
          `
        } catch (error) {
          console.log("Erro ao atualizar pedidos, continuando...")
        }
        newStatus = "needs_attention"
        message = `Conta da Mesa fechada. Todos os pedidos foram finalizados. Aguardando pagamento.`
        break

      case "confirm_payment":
        // Finalizar completamente - marcar todos como entregues e liberar mesa
        try {
          await sql`
            UPDATE orders 
            SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
            WHERE table_id = ${tableId}
          `

          // Limpar completamente a mesa
          await sql`
            UPDATE tables 
            SET access_token = NULL, 
                token_expires_at = NULL,
                last_access = NULL
            WHERE id = ${tableId}
          `
        } catch (error) {
          console.log("Erro ao finalizar pedidos, continuando...")
        }
        newStatus = "available"
        message = `Pagamento confirmado. Mesa completamente liberada e limpa.`
        break

      case "occupy":
        newStatus = "occupied"
        message = `Mesa marcada como ocupada.`
        break

      case "free":
        // Liberar mesa completamente e limpar tudo
        try {
          await sql`
            UPDATE orders 
            SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
            WHERE table_id = ${tableId}
          `

          await sql`
            UPDATE tables 
            SET access_token = NULL, 
                token_expires_at = NULL,
                last_access = NULL
            WHERE id = ${tableId}
          `
        } catch (error) {
          console.log("Erro ao limpar mesa, continuando...")
        }
        newStatus = "available"
        message = `Mesa liberada e completamente limpa.`
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
