import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Buscar informações da mesa
    const tableResult = await sql`
      SELECT id, table_number, seats, status, updated_at
      FROM tables 
      WHERE id = ${tableId}
    `

    if (tableResult.length === 0) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 })
    }

    const table = tableResult[0]

    // Ocupar mesa automaticamente se estiver disponível
    if (table.status === "available") {
      await sql`
        UPDATE tables 
        SET status = 'occupied', updated_at = NOW() 
        WHERE id = ${tableId}
      `
      table.status = "occupied"
    }

    return NextResponse.json({
      table,
      session: {
        tableId,
        isValid: true,
        wasOccupied: table.status === "occupied",
      },
    })
  } catch (error) {
    console.error("Erro ao validar sessão:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
