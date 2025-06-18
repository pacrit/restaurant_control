"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { OrderWithItems } from "@/lib/database"

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    // Atualizar pedidos a cada 30 segundos
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      setError(null)
      const response = await fetch("/api/orders?status=pending,preparing")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Ensure data is an array
      if (Array.isArray(data)) {
        setOrders(data)
      } else {
        console.error("API response is not an array:", data)
        setOrders([])
        setError("Formato de dados inválido recebido da API")
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      setOrders([]) // Ensure orders is always an array
      setError("Erro ao carregar pedidos. Tentando novamente...")
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchOrders()
      } else {
        alert("Erro ao atualizar status do pedido")
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error)
      alert("Erro ao atualizar status do pedido")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "preparing":
        return "Preparando"
      case "ready":
        return "Pronto"
      default:
        return status
    }
  }

  const getTimeElapsed = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    return diffInMinutes
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchOrders} className="bg-red-600 hover:bg-red-700">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cozinha</h1>
          <Badge variant="secondary" className="ml-auto">
            {orders.length} pedidos ativos
          </Badge>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhum pedido pendente</h2>
              <p className="text-gray-600">Todos os pedidos foram processados!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Mesa {order.table?.table_number || "N/A"}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {getTimeElapsed(order.created_at)}min
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Pedido #{order.id} • {new Date(order.created_at).toLocaleTimeString()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {order.items && Array.isArray(order.items) ? (
                      order.items.map((item) => (
                        <div key={item.id} className="border-l-4 border-orange-200 pl-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium">
                                {item.quantity}x {item.menu_item?.name || "Item desconhecido"}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">
                                Tempo: {item.menu_item?.preparation_time || 15} min
                              </div>
                              {item.notes && (
                                <div className="text-sm text-orange-600 mt-1 font-medium">Obs: {item.notes}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">Nenhum item encontrado</div>
                    )}
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-800">Observações do pedido:</div>
                          <div className="text-yellow-700">{order.notes}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-lg font-bold mb-4">
                    <span>Total:</span>
                    <span className="text-red-600">R$ {Number(order.total_amount).toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Iniciar Preparo
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Marcar como Pronto
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
