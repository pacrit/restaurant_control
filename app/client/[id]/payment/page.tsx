"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  CreditCard,
  Smartphone,
  QrCode,
  AlertCircle,
  RefreshCw,
  Home,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface Payment {
  id: number
  table_id: number
  table_number: number
  payment_method: string
  total_amount: number
  status: string
  pix_key?: string
  pix_qr_code?: string
  pix_copy_paste?: string
  expires_at: string
  created_at: string
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const tableId = Number.parseInt(params.id as string)

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card">("cash")
  const [totalAmount, setTotalAmount] = useState(0)
  const [orderIds, setOrderIds] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)

  useEffect(() => {
    fetchTableOrders()
  }, [tableId])

  useEffect(() => {
    if (payment && payment.status === "processing") {
      // Verificar status do pagamento a cada 5 segundos
      const interval = setInterval(checkPaymentStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [payment])

  useEffect(() => {
    if (payment && payment.expires_at) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expires = new Date(payment.expires_at).getTime()
        const timeLeft = Math.max(0, expires - now)
        setTimeLeft(timeLeft)

        if (timeLeft === 0 && payment.status === "processing") {
          setPayment({ ...payment, status: "cancelled" })
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [payment])

  const fetchTableOrders = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}/orders`)
      if (response.ok) {
        const orders = await response.json()
        const activeOrders = orders.filter((order: any) => order.status !== "delivered")

        if (activeOrders.length === 0) {
          setError("Nenhum pedido ativo encontrado para pagamento")
          return
        }

        const total = activeOrders.reduce((sum: number, order: any) => sum + order.total_amount, 0)
        const ids = activeOrders.map((order: any) => order.id)

        setTotalAmount(total)
        setOrderIds(ids)
      } else {
        setError("Erro ao buscar pedidos da mesa")
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  const createPayment = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_id: tableId,
          payment_method: paymentMethod,
          total_amount: totalAmount,
          order_ids: orderIds,
        }),
      })

      if (response.ok) {
        const paymentData = await response.json()
        setPayment(paymentData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Erro ao criar pagamento")
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error)
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!payment || checkingPayment) return

    try {
      setCheckingPayment(true)
      const response = await fetch(`/api/payments/${payment.id}`)

      if (response.ok) {
        const updatedPayment = await response.json()
        setPayment(updatedPayment)

        if (updatedPayment.status === "completed") {
          // Pagamento confirmado - redirecionar para sucesso
          setTimeout(() => {
            router.push("/")
          }, 3000)
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error)
    } finally {
      setCheckingPayment(false)
    }
  }

  const copyPixCode = async () => {
    if (payment?.pix_copy_paste) {
      try {
        await navigator.clipboard.writeText(payment.pix_copy_paste)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Erro ao copiar código PIX:", error)
      }
    }
  }

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "processing":
        return "Aguardando Pagamento"
      case "completed":
        return "Pago"
      case "failed":
        return "Falhou"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Carregando pagamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href={`/client/${tableId}`}>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar à Mesa
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de sucesso
  if (payment?.status === "completed") {
    return (
      <div className="min-h-screen bg-orange-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-800">Pagamento Confirmado!</h2>
            <p className="text-gray-600 mb-6">
              Seu pagamento de <strong>R$ {payment.total_amount.toFixed(2)}</strong> foi confirmado com sucesso.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A mesa foi liberada automaticamente. Obrigado pela preferência!
            </p>
            <Link href="/">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Home className="w-4 h-4 mr-2" />
                Finalizar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de pagamento PIX
  if (payment && payment.payment_method === "pix") {
    return (
      <div className="min-h-screen bg-orange-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/client/${tableId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Pagamento PIX</h1>
          </div>

          <div className="space-y-6">
            {/* Status do Pagamento */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Mesa {payment.table_number}</h2>
                    <p className="text-gray-600">Total: R$ {payment.total_amount.toFixed(2)}</p>
                  </div>
                  <Badge className={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
                </div>

                {timeLeft > 0 && payment.status === "processing" && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                    <span className="text-sm">restantes</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code PIX */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Escaneie o QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  {payment.pix_qr_code ? (
                    <img
                      src={payment.pix_qr_code || "/placeholder.svg"}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">Abra o app do seu banco e escaneie o QR Code para pagar</p>
              </CardContent>
            </Card>

            {/* Código Copia e Cola */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Ou copie o código PIX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-xs font-mono break-all text-gray-700">{payment.pix_copy_paste}</p>
                </div>
                <Button onClick={copyPixCode} className="w-full bg-transparent" variant="outline">
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Código PIX
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Como pagar:</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      1
                    </span>
                    Abra o app do seu banco ou carteira digital
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      2
                    </span>
                    Escaneie o QR Code ou cole o código PIX
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      3
                    </span>
                    Confirme o pagamento de R$ {payment.total_amount.toFixed(2)}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      4
                    </span>
                    Aguarde a confirmação automática
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Botão de Verificar */}
            <Button
              onClick={checkPaymentStatus}
              disabled={checkingPayment}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {checkingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Pagamento
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Tela de seleção de método de pagamento
  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/client/${tableId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Fechar Conta</h1>
        </div>

        <div className="space-y-6">
          {/* Resumo da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Total a Pagar:</span>
                <span className="text-orange-600">R$ {totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{orderIds.length} pedido(s) ativo(s)</p>
            </CardContent>
          </Card>

          {/* Métodos de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Escolha o método de pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "cash" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentMethod("cash")}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">Dinheiro</h3>
                    <p className="text-sm text-gray-600">Pagamento no balcão</p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "pix" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentMethod("pix")}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">PIX</h3>
                    <p className="text-sm text-gray-600">Pagamento instantâneo via QR Code</p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors opacity-50 ${
                  paymentMethod === "card" ? "border-orange-500 bg-orange-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">Cartão</h3>
                    <p className="text-sm text-gray-600">Em breve</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Confirmar */}
          <Button
            onClick={createPayment}
            disabled={loading || paymentMethod === "card"}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Pagamento
              </>
            )}
          </Button>

          {paymentMethod === "pix" && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Pagamento PIX</span>
              </div>
              <p className="text-sm text-blue-700">
                Após confirmar, você receberá um QR Code para pagamento instantâneo. A mesa será liberada
                automaticamente após a confirmação do pagamento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
