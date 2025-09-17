import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (isNaN(tableId)) {
      return NextResponse.json({ error: "ID da mesa inválido" }, { status: 400 })
    }

    // Verificar se a mesa existe e validar token
    const [table] = await sql`
      SELECT id, table_number, status, seats, created_at,
             COALESCE(updated_at, created_at) as updated_at,
             access_token, token_expires_at, last_access
      FROM tables 
      WHERE id = ${tableId}
    `

    if (!table) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 })
    }

    // Validação de segurança do token
    const now = new Date()
    const tokenExpired = table.token_expires_at ? new Date(table.token_expires_at) < now : true
    const validToken = token && table.access_token === token && !tokenExpired

    // Se não tem token válido, negar acesso
    if (!validToken) {
      return NextResponse.json(
        {
          error: "Acesso negado",
          reason: !token ? "Token de acesso obrigatório" : tokenExpired ? "Token expirado" : "Token inválido",
          requiresNewToken: true,
        },
        { status: 403 },
      )
    }

    // Atualizar último acesso
    await sql`
      UPDATE tables 
      SET last_access = CURRENT_TIMESTAMP
      WHERE id = ${tableId}
    `

    // Verificar pedidos ativos
    const activeOrders = await sql`
      SELECT COUNT(*) as active_count, MAX(created_at) as last_order
      FROM orders 
      WHERE table_id = ${tableId} 
        AND status IN ('pending', 'preparing', 'ready')
        AND created_at > NOW() - INTERVAL '3 hours'
    `

    const recentOrders = await sql`
      SELECT COUNT(*) as recent_count, MAX(created_at) as last_order
      FROM orders 
      WHERE table_id = ${tableId} 
        AND created_at > NOW() - INTERVAL '2 hours'
    `

    const hasActiveOrders = Number.parseInt(activeOrders[0]?.active_count || "0") > 0
    const hasRecentOrders = Number.parseInt(recentOrders[0]?.recent_count || "0") > 0

    // Validação de sessão
    let isSessionValid = false

    if (table.status === "needs_attention") {
      // Mesa aguardando pagamento - sessão inválida para novos pedidos
      isSessionValid = false
    } else if (table.status === "occupied" || hasActiveOrders || hasRecentOrders) {
      // Mesa ativa - sessão válida
      isSessionValid = true
    } else {
      // Outros casos - permitir acesso
      isSessionValid = true
    }

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
        tokenValid: true,
        tokenExpires: table.token_expires_at,
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

    // Marcar mesa como disponível e limpar token
    await sql`
      UPDATE tables 
      SET status = 'available', 
          access_token = NULL,
          token_expires_at = NULL,
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
