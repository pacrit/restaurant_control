"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Tablet, UtensilsCrossed, ChefHat, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Table } from "@/lib/database"

export default function HomePage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables")
      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error("Erro ao buscar mesas:", error)
    } finally {
      setLoading(false)
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
        return "Precisa Atenção"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Carregando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UtensilsCrossed className="w-12 h-12 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Sistema do Restaurante</h1>
          </div>
          <p className="text-gray-600 text-lg">Selecione uma mesa para começar ou acesse as funções administrativas</p>
        </div>

        {/* Botões de Acesso Rápido */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/kitchen">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <ChefHat className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Cozinha</h2>
                <p className="text-gray-600">Gerenciar pedidos e preparação</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/waiter">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Garçom</h2>
                <p className="text-gray-600">Atender chamados e fechar contas</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-purple-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Settings className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Administração</h2>
                <p className="text-gray-600">Dashboard e configurações</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Seleção de Mesas */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tablet className="w-6 h-6" />
            Selecionar Mesa
          </h2>
          <p className="text-gray-600 mb-6">Clique em uma mesa para acessar o cardápio e fazer pedidos</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <Link key={table.id} href={`/client/${table.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    Mesa {table.table_number}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{table.seats} lugares</p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <Badge className={getStatusColor(table.status)} variant="secondary">
                    {getStatusText(table.status)}
                  </Badge>

                  <Button className="w-full bg-orange-600 hover:bg-orange-700" size="lg">
                    <Tablet className="w-4 h-4 mr-2" />
                    Acessar Mesa
                  </Button>

                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <p>Mesa #{table.table_number}</p>
                    <p>Status: {getStatusText(table.status)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Instruções */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Tablet className="w-5 h-5 text-orange-600" />
                Como usar o sistema:
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium mb-2">Para Clientes:</h4>
                  <ul className="space-y-1">
                    <li>1. Clique na mesa desejada</li>
                    <li>2. Navegue pelo cardápio</li>
                    <li>3. Faça seus pedidos</li>
                    <li>4. Acompanhe o status</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Para Funcionários:</h4>
                  <ul className="space-y-1">
                    <li>• Cozinha: Gerenciar preparação</li>
                    <li>• Garçom: Atender e fechar contas</li>
                    <li>• Admin: Configurar sistema</li>
                    <li>• Acesso direto e simples</li>
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
