"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Tablet, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Table } from "@/lib/database"

export default function TabletAccessPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [accessingTable, setAccessingTable] = useState<number | null>(null)
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

  const accessTable = async (tableId: number, tableNumber: number) => {
    setAccessingTable(tableId)
    try {
      const response = await fetch(`/api/admin/tables/${tableId}/access`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        // Redirecionar para a mesa com token administrativo
        window.open(`/client/${tableId}?token=${data.token}`, "_blank")
      } else {
        alert("Erro ao acessar mesa")
      }
    } catch (error) {
      console.error("Erro ao acessar mesa:", error)
      alert("Erro ao acessar mesa")
    } finally {
      setAccessingTable(null)
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
          <div className="flex items-center gap-3">
            <Tablet className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Acesso via Tablet</h1>
              <p className="text-gray-600">Selecione uma mesa para acessar diretamente</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-blue-900">Acesso Administrativo</h2>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      • <strong>Token Estendido:</strong> 8 horas de validade (vs 4 horas do cliente)
                    </p>
                    <p>
                      • <strong>Acesso Direto:</strong> Sem necessidade de QR Code
                    </p>
                    <p>
                      • <strong>Controle Total:</strong> Ideal para tablets do restaurante
                    </p>
                    <p>
                      • <strong>Segurança:</strong> Tokens únicos e temporários
                    </p>
                  </div>
                </div>
              </div>
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
                  <p>Status: {table.status}</p>
                </div>

                <Button
                  onClick={() => accessTable(table.id, table.table_number)}
                  disabled={accessingTable === table.id}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {accessingTable === table.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Acessando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Acessar Mesa
                    </>
                  )}
                </Button>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <p>🔒 Token administrativo</p>
                  <p>⏰ Válido por 8 horas</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Tablet className="w-5 h-5 text-blue-600" />
                Como usar o Acesso via Tablet:
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium mb-2">Para Garçons:</h4>
                  <ul className="space-y-1">
                    <li>1. Clique em "Acessar Mesa"</li>
                    <li>2. Nova aba abrirá com acesso direto</li>
                    <li>3. Cliente pode fazer pedidos normalmente</li>
                    <li>4. Token válido por 8 horas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Vantagens:</h4>
                  <ul className="space-y-1">
                    <li>• Não precisa de QR Code</li>
                    <li>• Acesso imediato às mesas</li>
                    <li>• Ideal para tablets fixos</li>
                    <li>• Controle administrativo completo</li>
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
