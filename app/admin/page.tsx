"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, TrendingUp, Clock, Star, AlertCircle, QrCode } from "lucide-react"
import Link from "next/link"

interface TopSellingItem {
  name: string
  quantity: number
  revenue: number
}

interface RecentOrder {
  id: number
  table_number: number
  total_amount: number
  status: string
  created_at: string
}

interface DashboardStats {
  totalRevenue: number
  todayRevenue: number
  totalOrders: number
  todayOrders: number
  averageOrderValue: number
  topSellingItems: TopSellingItem[]
  recentOrders: RecentOrder[]
}

// Default empty stats to prevent undefined errors
const defaultStats: DashboardStats = {
  totalRevenue: 0,
  todayRevenue: 0,
  totalOrders: 0,
  todayOrders: 0,
  averageOrderValue: 0,
  topSellingItems: [],
  recentOrders: [],
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today")

  useEffect(() => {
    fetchDashboardStats()
  }, [selectedPeriod])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/dashboard?period=${selectedPeriod}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()

      // Validate data structure
      if (!data || typeof data !== "object") {
        throw new Error("Invalid data format received from API")
      }

      // Create a valid stats object with defaults for missing properties
      const validStats: DashboardStats = {
        totalRevenue: typeof data.totalRevenue === "number" && !isNaN(data.totalRevenue) ? data.totalRevenue : 0,
        todayRevenue: typeof data.todayRevenue === "number" && !isNaN(data.todayRevenue) ? data.todayRevenue : 0,
        totalOrders: typeof data.totalOrders === "number" && !isNaN(data.totalOrders) ? data.totalOrders : 0,
        todayOrders: typeof data.todayOrders === "number" && !isNaN(data.todayOrders) ? data.todayOrders : 0,
        averageOrderValue:
          typeof data.averageOrderValue === "number" && !isNaN(data.averageOrderValue) ? data.averageOrderValue : 0,
        topSellingItems: Array.isArray(data.topSellingItems)
          ? data.topSellingItems.map((item: any) => ({
              name: item?.name?.toString() || "Item desconhecido",
              quantity: typeof item?.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 0,
              revenue: typeof item?.revenue === "number" && !isNaN(item.revenue) ? item.revenue : 0,
            }))
          : [],
        recentOrders: Array.isArray(data.recentOrders)
          ? data.recentOrders.map((order: any) => ({
              id: typeof order?.id === "number" ? order.id : 0,
              table_number: typeof order?.table_number === "number" ? order.table_number : 0,
              total_amount:
                typeof order?.total_amount === "number" && !isNaN(order.total_amount) ? order.total_amount : 0,
              status: order?.status?.toString() || "unknown",
              created_at: order?.created_at?.toString() || new Date().toISOString(),
            }))
          : [],
      }

      setStats(validStats)
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
      setError(`Erro ao carregar dados do dashboard: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      setStats(defaultStats) // Reset to default stats on error
    } finally {
      setLoading(false)
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
      case "delivered":
        return "bg-gray-100 text-gray-800"
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
      case "delivered":
        return "Entregue"
      default:
        return status
    }
  }

  const formatCurrency = (value: number) => {
    return isNaN(value) ? "R$ 0,00" : `R$ ${value.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return "Data inválida"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <Button onClick={fetchDashboardStats} className="bg-blue-600 hover:bg-blue-700">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          </div>

          <div className="flex gap-2">
            {(["today", "week", "month"] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period)}
                className={selectedPeriod === period ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {period === "today" ? "Hoje" : period === "week" ? "Semana" : "Mês"}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Hoje: {formatCurrency(stats.todayRevenue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Hoje: {stats.todayOrders} pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">Por pedido</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25 min</div>
              <p className="text-xs text-muted-foreground">Preparo médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Card para QR Codes */}
        <div className="mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">QR Codes das Mesas</CardTitle>
              <CardDescription>Gerar e baixar QR Codes para cada mesa</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/qrcodes">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerenciar QR Codes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Itens Mais Vendidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Itens Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topSellingItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum dado disponível para o período selecionado</div>
              ) : (
                <div className="space-y-4">
                  {stats.topSellingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.quantity} vendidos</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{formatCurrency(item.revenue)}</div>
                        <div className="text-sm text-gray-600">receita</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pedidos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum pedido recente para o período selecionado</div>
              ) : (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          Pedido #{order.id} - Mesa {order.table_number}
                        </div>
                        <div className="text-sm text-gray-600">{formatDate(order.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(order.total_amount)}</div>
                        <Badge className={getStatusColor(order.status)} variant="secondary">
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
