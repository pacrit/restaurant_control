"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Table } from "@/lib/database"

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)

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

  const closeTableSession = async (tableId: number, tableNumber: number) => {
    if (!confirm(`Tem certeza que deseja fechar a sessão da Mesa ${tableNumber}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tables/${tableId}/session`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert(`Sessão da Mesa ${tableNumber} fechada com sucesso!`)
        fetchTables() // Atualizar lista
      } else {
        alert("Erro ao fechar sessão da mesa")
      }
    } catch (error) {
      console.error("Erro ao fechar sessão:", error)
      alert("Erro ao fechar sessão da mesa")
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
      <div className="min-h-screen bg-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando mesas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Mesas</h1>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">Controle de Sessões:</h2>
              <p className="text-sm text-gray-600">
                Use o botão "Fechar Sessão" para liberar uma mesa e invalidar qualquer acesso remoto que o cliente possa
                ter. Isso é útil quando o cliente já pagou e saiu, mas ainda pode ter a página aberta em casa.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
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

                <div className="text-xs text-gray-500">
                  <p>ID: {table.id}</p>
                  <p>URL: /client/{table.id}</p>
                </div>

                <div className="flex flex-col gap-2">
                  {table.status !== "available" && (
                    <Button
                      onClick={() => closeTableSession(table.id, table.table_number)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Fechar Sessão
                    </Button>
                  )}

                  <Link href={`/client/${table.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Visualizar Mesa
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Sistema de Segurança Implementado:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  ✅ <strong>Validação de Sessão:</strong> Verifica se a mesa ainda está ativa
                </li>
                <li>
                  ✅ <strong>Timeout de Inatividade:</strong> 30 minutos sem atividade = sessão expirada
                </li>
                <li>
                  ✅ <strong>Controle de Status:</strong> Mesa liberada = acesso negado
                </li>
                <li>
                  ✅ <strong>Revalidação Automática:</strong> Verifica sessão a cada 2 minutos
                </li>
                <li>
                  ✅ <strong>Fechamento Manual:</strong> Admin pode fechar sessão remotamente
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
