import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Verificar se a mesa existe
    const [table] = await sql`
      SELECT id, table_number, status FROM tables WHERE id = ${tableId}
    `

    if (!table) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 })
    }

    // Gerar token administrativo (válido por 8 horas para tablets do restaurante)
    const [result] = await sql`
      SELECT generate_table_token(${tableId}, INTERVAL '8 hours') as token
    `

    const token = result.token

    // Ocupar a mesa se estiver disponível
    if (table.status === "available") {
      await sql`
        UPDATE tables 
        SET status = 'occupied'
        WHERE id = ${tableId}
      `
    }

    return NextResponse.json({
      success: true,
      token,
      tableId,
      tableNumber: table.table_number,
      accessUrl: `/client/${tableId}?token=${token}`,
      isAdminAccess: true,
    })
  } catch (error) {
    console.error("Erro ao gerar token administrativo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
