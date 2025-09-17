import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Aqui você validaria a assinatura do webhook da API de pagamento
    // const signature = request.headers.get('x-signature')
    // if (!validateWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const { payment_id, status, transaction_id, end_to_end_id } = body

    if (!payment_id || !status) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    // Buscar o pagamento pelo ID externo
    const [payment] = await sql`
      SELECT * FROM payments 
      WHERE external_payment_id = ${payment_id}
    `

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    // Atualizar o pagamento
    const updateData: any = {
      status: mapExternalStatusToInternal(status),
      webhook_data: body,
    }

    if (transaction_id) {
      updateData.pix_transaction_id = transaction_id
    }

    if (end_to_end_id) {
      updateData.pix_end_to_end_id = end_to_end_id
    }

    if (updateData.status === "completed") {
      updateData.paid_at = new Date()
    }

    const [updatedPayment] = await sql`
      UPDATE payments 
      SET status = ${updateData.status},
          pix_transaction_id = ${updateData.pix_transaction_id || payment.pix_transaction_id},
          pix_end_to_end_id = ${updateData.pix_end_to_end_id || payment.pix_end_to_end_id},
          paid_at = ${updateData.paid_at || payment.paid_at},
          webhook_data = ${JSON.stringify(updateData.webhook_data)},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${payment.id}
      RETURNING *
    `

    // Se o pagamento foi confirmado, liberar a mesa automaticamente
    if (updateData.status === "completed") {
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

      console.log(`✅ Pagamento confirmado via webhook - Mesa ${payment.table_id} liberada automaticamente`)
    }

    return NextResponse.json({ success: true, payment: updatedPayment })
  } catch (error) {
    console.error("Erro no webhook de pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

function mapExternalStatusToInternal(externalStatus: string): string {
  const statusMap: { [key: string]: string } = {
    paid: "completed",
    approved: "completed",
    confirmed: "completed",
    pending: "processing",
    cancelled: "cancelled",
    failed: "failed",
    expired: "cancelled",
  }

  return statusMap[externalStatus.toLowerCase()] || "processing"
}
