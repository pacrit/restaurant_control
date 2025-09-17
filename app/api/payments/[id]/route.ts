import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paymentId = Number.parseInt(params.id)

    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "ID do pagamento inválido" }, { status: 400 })
    }

    const [payment] = await sql`
      SELECT p.*, t.table_number
      FROM payments p
      LEFT JOIN tables t ON p.table_id = t.id
      WHERE p.id = ${paymentId}
    `

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ...payment,
      total_amount: Number.parseFloat(payment.total_amount),
    })
  } catch (error) {
    console.error("Erro ao buscar pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paymentId = Number.parseInt(params.id)
    const body = await request.json()
    const { status, pix_transaction_id, external_payment_id } = body

    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "ID do pagamento inválido" }, { status: 400 })
    }

    const updateData: any = { status }

    if (pix_transaction_id) {
      updateData.pix_transaction_id = pix_transaction_id
    }

    if (external_payment_id) {
      updateData.external_payment_id = external_payment_id
    }

    if (status === "completed") {
      updateData.paid_at = new Date()
    }

    const [payment] = await sql`
      UPDATE payments 
      SET status = ${updateData.status},
          pix_transaction_id = ${updateData.pix_transaction_id || null},
          external_payment_id = ${updateData.external_payment_id || null},
          paid_at = ${updateData.paid_at || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${paymentId}
      RETURNING *
    `

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    // Se o pagamento foi confirmado, liberar a mesa
    if (status === "completed") {
      await sql`
        UPDATE tables 
        SET status = 'available',
            access_token = NULL,
            token_expires_at = NULL,
            last_access = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${payment.table_id}
      `

      // Marcar todos os pedidos como entregues
      await sql`
        UPDATE orders 
        SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
        WHERE table_id = ${payment.table_id}
      `
    }

    return NextResponse.json({
      ...payment,
      total_amount: Number.parseFloat(payment.total_amount),
    })
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
