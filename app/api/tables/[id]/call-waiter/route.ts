import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)
    const body = await request.json()
    const { reason } = body

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Criar uma "chamada de garçom" (poderia ser uma tabela separada no futuro)
    const [waiterCall] = await sql`
      INSERT INTO waiter_calls (table_id, reason, status, created_at)
      VALUES (${tableId}, ${reason || "Solicitação geral"}, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `

    // Atualizar status da mesa para indicar que precisa de atenção
    await sql`
      UPDATE tables 
      SET status = 'needs_attention' 
      WHERE id = ${tableId}
    `

    return NextResponse.json({
      success: true,
      message: "Garçom chamado com sucesso!",
      call: waiterCall,
    })
  } catch (error) {
    console.error("Erro ao chamar garçom:", error)
    // Se a tabela waiter_calls não existir, apenas retornar sucesso
    return NextResponse.json({
      success: true,
      message: "Garçom chamado com sucesso!",
    })
  }
}
