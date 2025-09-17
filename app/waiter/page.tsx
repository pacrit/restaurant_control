"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, DollarSign, CheckCircle, Clock, CreditCard } from "lucide-react"
import Link from "next/link"
import type { Table, OrderWithItems } from "@/lib/database"

interface TableWithOrders extends Table {
  activeOrders: OrderWithItems[]
  totalAmount: number
  lastOrderTime?: string
}

export default function WaiterPage() {
  const [tables, setTables] = useState<TableWithOrders[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTablesWithOrders()
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchTablesWithOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchTablesWithOrders = async () => {
    try {
      const [tablesResponse, ordersResponse] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/orders?status=delivered,ready,preparing,pending"),
      ])

      const tablesData = await tablesResponse.json()
      const ordersData = await ordersResponse.json()

      // Combinar dados de mesas com pedidos
      const tablesWithOrders = tablesData.map((table: Table) => {
        const tableOrders = ordersData.filter((order: OrderWithItems) => order.table_id === table.id)
        const totalAmount = tableOrders.reduce((sum: number, order: OrderWithItems) => sum + order.total_amount, 0)
        const lastOrder = tableOrders.sort(
          (a: OrderWithItems, b: OrderWithItems) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]

        return {
          ...table,
          activeOrders: tableOrders,
          totalAmount,
          lastOrderTime: lastOrder?.created_at,
        }
      })

      setTables(tablesWithOrders)
    } catch (error) {
      console.error("Erro ao buscar mesas e pedidos:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTableStatus = async (tableId: number, action: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/status-simple`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchTablesWithOrders() // Atualizar lista
      } else {
        const errorData = await response.json()
        alert(`Erro: ${errorData.error || "Erro ao atualizar status da mesa"}`)
      }
    } catch (error) {
      console.error("Erro ao atualizar mesa:", error)
      alert("Erro ao atualizar status da mesa")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-blue-100 text-blue-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      case "needs_attention":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível"
      case "occupied":
        return "Ocupada"
      case "reserved":
        return "Reservada"
      case "needs_attention":
        return "Aguardando Pagamento"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="w-4 h-4" />
      case "occupied":
        return <Users className="w-4 h-4" />
      case "reserved":
        return <Clock className="w-4 h-4" />
      case "needs_attention":
        return <CreditCard className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Carregando mesas...</p>
        </div>
      </div>
    )
  }

  const occupiedTables = tables.filter((table) => table.status !== "available")
  const availableTables = tables.filter((table) => table.status === "available")

  return (
    <div className="min-h-screen bg-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Garçom</h1>
          <Badge variant="secondary" className="ml-auto">
            {occupiedTables.length} mesas ativas
          </Badge>
        </div>

        {/* Mesas Ativas */}
        {occupiedTables.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Mesas Ativas ({occupiedTables.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {occupiedTables.map((table) => (
                <Card key={table.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {getStatusIcon(table.status)}
                        Mesa {table.table_number}
                      </CardTitle>
                      <Badge className={getStatusColor(table.status)} variant="secondary">
                        {getStatusText(table.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{table.seats} lugares</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Informações dos Pedidos */}
                    {table.activeOrders.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Pedidos:</span>
                          <span className="text-sm">{table.activeOrders.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total:</span>
                          <span className="text-lg font-bold text-green-600">R$ {table.totalAmount.toFixed(2)}</span>
                        </div>
                        {table.lastOrderTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            Último: {new Date(table.lastOrderTime).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações por Status */}
                    <div className="flex flex-col gap-2">
                      {table.status === "occupied" && (
                        <Button
                          onClick={() => updateTableStatus(table.id, "close_bill")}
                          className="bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Fechar Conta
                        </Button>
                      )}

                      {table.status === "needs_attention" && (
                        <Button
                          onClick={() => updateTableStatus(table.id, "confirm_payment")}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Pagamento
                        </Button>
                      )}

                      {/* Ação de emergência */}
                      <Button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja liberar a Mesa ${table.table_number}?`)) {
                            updateTableStatus(table.id, "free")
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Liberar Mesa
                      </Button>
                    </div>

                    {/* Link para ver detalhes */}
                    <Link href={`/client/${table.id}`} target="_blank">
                      <Button variant="ghost" size="sm" className="w-full">
                        Ver Mesa
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mesas Disponíveis */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Mesas Disponíveis ({availableTables.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableTables.map((table) => (
              <Card key={table.id} className="text-center">
                <CardContent className="p-4">
                  <div className="text-lg font-semibold">Mesa {table.table_number}</div>
                  <div className="text-sm text-gray-600">{table.seats} lugares</div>
                  <Badge className={getStatusColor(table.status)} variant="secondary" className="mt-2">
                    {getStatusText(table.status)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Fluxo Simplificado:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">1. Mesa Ocupada:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Cliente faz pedidos pelo QR Code</li>
                    <li>• Pedidos aparecem na cozinha</li>
                    <li>• Você entrega os pratos</li>
                    <li>• Clique "Fechar Conta"</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-2">2. Aguardando Pagamento:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Conta foi fechada</li>
                    <li>• Cliente não pode mais fazer pedidos</li>
                    <li>• Receba o pagamento</li>
                    <li>• Clique "Confirmar Pagamento"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
