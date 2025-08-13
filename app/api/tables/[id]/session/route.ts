import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Verificar se a mesa existe e seu status atual
    const [table] = await sql`
      SELECT id, table_number, status, seats, created_at,
             COALESCE(updated_at, created_at) as updated_at
      FROM tables 
      WHERE id = ${tableId}
    `

    if (!table) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 })
    }

    // Verificar se há pedidos ativos (não entregues) nos últimos 3 horas
    const activeOrders = await sql`
      SELECT COUNT(*) as active_count, MAX(created_at) as last_order
      FROM orders 
      WHERE table_id = ${tableId} 
        AND status IN ('pending', 'preparing', 'ready')
        AND created_at > NOW() - INTERVAL '3 hours'
    `

    // Verificar se há pedidos recentes (últimas 2 horas) mesmo que entregues
    const recentOrders = await sql`
      SELECT COUNT(*) as recent_count, MAX(created_at) as last_order
      FROM orders 
      WHERE table_id = ${tableId} 
        AND created_at > NOW() - INTERVAL '2 hours'
    `

    const hasActiveOrders = Number.parseInt(activeOrders[0]?.active_count || "0") > 0
    const hasRecentOrders = Number.parseInt(recentOrders[0]?.recent_count || "0") > 0

    // Determinar se a sessão é válida
    const isSessionValid =
      table.status === "occupied" || hasActiveOrders || (hasRecentOrders && table.status !== "available")

    return NextResponse.json({
      table: {
        id: table.id,
        table_number: table.table_number,
        status: table.status,
        seats: table.seats,
      },
      session: {
        isValid: isSessionValid,
        hasActiveOrders,
        hasRecentOrders,
        lastOrderTime: activeOrders[0]?.last_order || recentOrders[0]?.last_order,
      },
    })
  } catch (error) {
    console.error("Erro ao verificar sessão da mesa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Marcar mesa como disponível (fechar sessão)
    await sql`
      UPDATE tables 
      SET status = 'available', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${tableId}
    `

    return NextResponse.json({
      success: true,
      message: "Sessão da mesa encerrada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao encerrar sessão da mesa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
