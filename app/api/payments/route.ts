import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table_id, payment_method, total_amount, order_ids } = body

    if (!table_id || !payment_method || !total_amount || !order_ids?.length) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    // Verificar se a mesa existe e tem pedidos
    const [table] = await sql`
      SELECT id, table_number, status FROM tables WHERE id = ${table_id}
    `

    if (!table) {
      return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 })
    }

    // Criar o pagamento
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    const [payment] = await sql`
      INSERT INTO payments (
        table_id, 
        order_ids, 
        payment_method, 
        total_amount, 
        status,
        expires_at
      )
      VALUES (
        ${table_id}, 
        ${order_ids}, 
        ${payment_method}, 
        ${total_amount}, 
        'pending',
        ${expiresAt}
      )
      RETURNING *
    `

    // Se for PIX, gerar dados do PIX (mock para agora)
    if (payment_method === "pix") {
      const pixData = generateMockPixData(payment.id, total_amount)

      const [updatedPayment] = await sql`
        UPDATE payments 
        SET pix_key = ${pixData.pix_key},
            pix_qr_code = ${pixData.qr_code},
            pix_copy_paste = ${pixData.copy_paste},
            status = 'processing'
        WHERE id = ${payment.id}
        RETURNING *
      `

      return NextResponse.json({
        ...updatedPayment,
        total_amount: Number.parseFloat(updatedPayment.total_amount),
        table_number: table.table_number,
      })
    }

    return NextResponse.json({
      ...payment,
      total_amount: Number.parseFloat(payment.total_amount),
      table_number: table.table_number,
    })
  } catch (error) {
    console.error("Erro ao criar pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função mock para gerar dados do PIX (substituir pela integração real)
function generateMockPixData(paymentId: number, amount: number) {
  const pixKey = "restaurante@exemplo.com" // Chave PIX do restaurante
  const copyPaste = `00020126580014br.gov.bcb.pix0136${pixKey}0208Pagamento52040000530398654${amount.toFixed(2).padStart(10, "0")}5802BR5925NOME DO RESTAURANTE6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  return {
    pix_key: pixKey,
    qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // QR Code mock
    copy_paste: copyPaste,
  }
}
