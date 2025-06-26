"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Eye } from "lucide-react"
import Link from "next/link"
import type { Table } from "@/lib/database"

export default function QRCodesPage() {
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

  const generateQRCodeURL = (tableId: number) => {
    const baseURL = typeof window !== "undefined" ? window.location.origin : ""
    return `${baseURL}/client/mesa/${tableId}`
  }

  const generateQRCodeImage = (tableId: number) => {
    const url = generateQRCodeURL(tableId)
    // Usando QR Server API para gerar QR Code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }

  const downloadQRCode = async (tableId: number, tableNumber: number) => {
    try {
      const qrCodeURL = generateQRCodeImage(tableId)
      const response = await fetch(qrCodeURL)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mesa-${tableNumber}-qrcode.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao baixar QR Code:", error)
      alert("Erro ao baixar QR Code")
    }
  }

  const previewTable = (tableId: number) => {
    const url = generateQRCodeURL(tableId)
    window.open(url, "_blank")
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
          <h1 className="text-3xl font-bold text-gray-900">QR Codes das Mesas</h1>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">Como usar:</h2>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cada mesa tem um QR Code único que leva direto ao cardápio</li>
                <li>• Os clientes escaneiam o QR Code e fazem pedidos diretamente</li>
                <li>• Baixe os QR Codes e imprima para colocar nas mesas</li>
                <li>• Use o botão "Visualizar" para testar o QR Code</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Mesa {table.table_number}</CardTitle>
                <p className="text-sm text-gray-600">{table.seats} lugares</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <img
                    src={generateQRCodeImage(table.id) || "/placeholder.svg"}
                    alt={`QR Code Mesa ${table.table_number}`}
                    className="mx-auto border rounded-lg"
                    width={150}
                    height={150}
                  />
                </div>

                <div className="text-xs text-gray-500 mb-4 break-all">{generateQRCodeURL(table.id)}</div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadQRCode(table.id, table.table_number)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar
                  </Button>
                  <Button onClick={() => previewTable(table.id)} variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Instruções para impressão:</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Clique em "Baixar" para cada mesa</li>
                <li>2. Imprima os QR Codes em papel de qualidade</li>
                <li>3. Plastifique ou use suporte resistente</li>
                <li>4. Coloque em local visível na mesa</li>
                <li>5. Teste escaneando com um celular</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
