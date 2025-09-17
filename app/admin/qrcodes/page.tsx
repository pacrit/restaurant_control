"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Eye, Shield, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { Table } from "@/lib/database"

interface TableWithToken extends Table {
  access_token?: string
  token_expires_at?: string
  secure_url?: string
}

export default function QRCodesPage() {
  const [tables, setTables] = useState<TableWithToken[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingToken, setGeneratingToken] = useState<number | null>(null)

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

  const generateSecureToken = async (tableId: number) => {
    try {
      setGeneratingToken(tableId)
      const response = await fetch(`/api/tables/${tableId}/generate-token`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()

        // Atualizar a mesa com o novo token
        setTables(
          tables.map((table) =>
            table.id === tableId ? { ...table, access_token: result.token, secure_url: result.accessUrl } : table,
          ),
        )

        return result.accessUrl
      } else {
        alert("Erro ao gerar token seguro")
        return null
      }
    } catch (error) {
      console.error("Erro ao gerar token:", error)
      alert("Erro ao gerar token seguro")
      return null
    } finally {
      setGeneratingToken(null)
    }
  }

  const generateQRCodeImage = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }

  const downloadQRCode = async (tableId: number, tableNumber: number) => {
    try {
      // Gerar token seguro primeiro
      const secureUrl = await generateSecureToken(tableId)
      if (!secureUrl) return

      const fullUrl = `${window.location.origin}${secureUrl}`
      const qrCodeURL = generateQRCodeImage(fullUrl)

      const response = await fetch(qrCodeURL)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mesa-${tableNumber}-qrcode-seguro.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao baixar QR Code:", error)
      alert("Erro ao baixar QR Code")
    }
  }

  const previewTable = async (tableId: number) => {
    const secureUrl = await generateSecureToken(tableId)
    if (secureUrl) {
      const fullUrl = `${window.location.origin}${secureUrl}`
      window.open(fullUrl, "_blank")
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
          <h1 className="text-3xl font-bold text-gray-900">QR Codes Seguros das Mesas</h1>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-green-800">Sistema de Segurança Implementado</h2>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  🔒 <strong>Tokens Seguros:</strong> Cada QR Code gera um token único válido por 4 horas
                </li>
                <li>
                  🚫 <strong>Acesso Direto Bloqueado:</strong> URLs diretas sem token são rejeitadas
                </li>
                <li>
                  ⏰ <strong>Expiração Automática:</strong> Tokens expiram automaticamente para segurança
                </li>
                <li>
                  🔄 <strong>Renovação Dinâmica:</strong> Novos tokens são gerados a cada uso
                </li>
                <li>
                  📱 <strong>Validação em Tempo Real:</strong> Sistema verifica autenticidade constantemente
                </li>
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
                  {table.secure_url ? (
                    <img
                      src={
                        generateQRCodeImage(`${window.location.origin || "/placeholder.svg"}${table.secure_url}`) ||
                        "/placeholder.svg"
                      }
                      alt={`QR Code Seguro Mesa ${table.table_number}`}
                      className="mx-auto border rounded-lg"
                      width={150}
                      height={150}
                    />
                  ) : (
                    <div className="w-[150px] h-[150px] mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Clique para gerar QR Code seguro</p>
                      </div>
                    </div>
                  )}
                </div>

                {table.secure_url && (
                  <div className="text-xs text-gray-500 mb-4 break-all font-mono bg-gray-50 p-2 rounded">
                    {`${window.location.origin}${table.secure_url}`}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => downloadQRCode(table.id, table.table_number)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                    disabled={generatingToken === table.id}
                  >
                    {generatingToken === table.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Baixar Seguro
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => previewTable(table.id)}
                    variant="outline"
                    size="sm"
                    disabled={generatingToken === table.id}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Testar
                  </Button>

                  {table.access_token && (
                    <Button
                      onClick={() => generateSecureToken(table.id)}
                      variant="outline"
                      size="sm"
                      className="border-orange-600 text-orange-600"
                      disabled={generatingToken === table.id}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Renovar Token
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Instruções de Segurança:
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Para Impressão:</h4>
                  <ol className="space-y-1 text-gray-600">
                    <li>1. Clique em "Baixar Seguro" para cada mesa</li>
                    <li>2. Cada download gera um novo token único</li>
                    <li>3. Imprima em papel de qualidade</li>
                    <li>4. Plastifique para durabilidade</li>
                    <li>5. Coloque em local visível na mesa</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">Segurança:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Tokens expiram em 4 horas automaticamente</li>
                    <li>• Acesso direto por URL é bloqueado</li>
                    <li>• Cada QR Code é único e rastreável</li>
                    <li>• Sistema detecta tentativas de burla</li>
                    <li>• Renovação de tokens quando necessário</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Problemas Resolvidos:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                  <div>❌ Acesso direto: /client/1</div>
                  <div>✅ Acesso seguro: /client/1?token=abc123...</div>
                  <div>❌ URLs "chutadas" de casa</div>
                  <div>✅ Apenas QR Codes válidos funcionam</div>
                  <div>❌ Pedidos "de sacanagem"</div>
                  <div>✅ Validação em tempo real</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
