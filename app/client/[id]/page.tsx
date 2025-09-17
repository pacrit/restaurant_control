"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  ShoppingCart,
  Plus,
  Minus,
  Send,
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTableSession } from "@/hooks/use-table-session"
import type { MenuItem, MenuCategory, OrderWithItems } from "@/lib/database"

interface CartItem extends MenuItem {
  quantity: number
  notes?: string
}

export default function MesaClientPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const tableId = Number.parseInt(params.id as string)

  const { session, loading: sessionLoading, error: sessionError, isValid, validateSession } = useTableSession(tableId)

  const [step, setStep] = useState<"loading" | "menu" | "cart" | "confirmation" | "dashboard" | "orders">("loading")
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [orderNotes, setOrderNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [tableOrders, setTableOrders] = useState<OrderWithItems[]>([])

  useEffect(() => {
    if (tableId && !sessionLoading) {
      if (sessionError && !session) {
        console.warn("Erro na sessão, mas permitindo acesso:", sessionError)
        toast({
          variant: "warning",
          title: "Aviso",
          description: "Houve um problema na validação, mas o acesso foi liberado.",
        })
      }
      initializeTable()
    }
  }, [tableId, sessionLoading, sessionError, session, toast])

  const initializeTable = async () => {
    try {
      setLoading(true)

      // Buscar pedidos existentes da mesa
      await fetchTableOrders()

      // Buscar categorias e itens do menu
      await Promise.all([fetchCategories(), fetchMenuItems()])

      setStep("menu")
    } catch (error) {
      console.error("Erro ao inicializar mesa:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados da mesa. Tentando continuar...",
      })
      setStep("menu")
    } finally {
      setLoading(false)
    }
  }

  const fetchTableOrders = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}/orders`)
      if (response.ok) {
        const orders = await response.json()
        setTableOrders(orders)
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos da mesa:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/menu/categories")
      const data = await response.json()
      setCategories(data)
      if (data.length > 0) {
        setSelectedCategory(data[0].id)
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as categorias do menu.",
      })
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu/items")
      const data = await response.json()
      const itemsWithNumericPrices = data.map((item: any) => ({
        ...item,
        price: Number.parseFloat(item.price),
      }))
      setMenuItems(itemsWithNumericPrices)
    } catch (error) {
      console.error("Erro ao buscar itens do menu:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os itens do menu.",
      })
    }
  }

  const addToCart = (item: MenuItem) => {
    // Verificar se a mesa está aguardando pagamento
    if (session?.table.status === "needs_attention") {
      toast({
        variant: "warning",
        title: "Pedidos Bloqueados",
        description: "Esta mesa está aguardando pagamento. Não é possível fazer novos pedidos.",
      })
      return
    }

    const itemWithNumericPrice = {
      ...item,
      price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price,
    }

    const existingItem = cart.find((cartItem) => cartItem.id === itemWithNumericPrice.id)
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === itemWithNumericPrice.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        ),
      )
    } else {
      setCart([...cart, { ...itemWithNumericPrice, quantity: 1 }])
    }

    toast({
      variant: "success",
      title: "Item Adicionado",
      description: `${item.name} foi adicionado ao carrinho.`,
    })
  }

  const updateCartItemQuantity = (itemId: number, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter((item) => item.id !== itemId))
      toast({
        variant: "default",
        title: "Item Removido",
        description: "Item removido do carrinho.",
      })
    } else {
      setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
    }
  }

  const updateCartItemNotes = (itemId: number, notes: string) => {
    setCart(cart.map((item) => (item.id === itemId ? { ...item, notes } : item)))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const submitOrder = async () => {
    if (!session?.table || cart.length === 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_id: session.table.id,
          items: cart.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            notes: item.notes,
          })),
          notes: orderNotes,
          total_amount: getTotalAmount(),
        }),
      })

      if (response.ok) {
        setStep("confirmation")
        setCart([])
        setOrderNotes("")
        // Atualizar pedidos da mesa em background
        fetchTableOrders()
        toast({
          variant: "success",
          title: "Pedido Enviado!",
          description: "Seu pedido foi enviado para a cozinha com sucesso.",
        })
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Erro ao Enviar Pedido",
          description: errorData.error || "Erro desconhecido. Tente novamente.",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar pedido:", error)
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível enviar o pedido. Verifique sua conexão.",
      })
    } finally {
      setLoading(false)
    }
  }

  const callWaiter = async (reason = "Solicitação geral") => {
    try {
      const response = await fetch(`/api/tables/${tableId}/call-waiter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        toast({
          variant: "success",
          title: "Garçom Chamado!",
          description: "O garçom foi notificado e virá atendê-lo em breve.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível chamar o garçom. Tente novamente.",
        })
      }
    } catch (error) {
      console.error("Erro ao chamar garçom:", error)
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível chamar o garçom. Verifique sua conexão.",
      })
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

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item) => item.category_id === selectedCategory && item.available)
    : menuItems.filter((item) => item.available)

  if (step === "loading" || sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-orange-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-lg font-medium">Carregando mesa...</p>
          <p className="text-sm text-gray-600 mt-2">Preparando seu atendimento</p>
        </div>
      </div>
    )
  }

  if (step === "menu") {
    return (
      <div className="min-h-screen bg-orange-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Cardápio - Mesa {session?.table?.table_number || tableId}
                </h1>
                {session?.table.status === "needs_attention" && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600">
                      Mesa aguardando pagamento - novos pedidos bloqueados
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setStep("orders")}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Acompanhar Pedidos
              </Button>
              <Button
                onClick={() => setStep("cart")}
                className="bg-orange-600 hover:bg-orange-700 relative"
                disabled={cart.length === 0 || session?.table.status === "needs_attention"}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrinho
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Categorias */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Itens do Menu */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="secondary">{item.preparation_time} min</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-orange-600">R$ {item.price.toFixed(2)}</span>
                    <Button
                      onClick={() => addToCart(item)}
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={session?.table.status === "needs_attention"}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMenuItems.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">Nenhum item disponível nesta categoria</p>
                <Button onClick={() => setSelectedCategory(categories[0]?.id || null)} variant="outline">
                  Ver Todas as Categorias
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (step === "cart") {
    return (
      <div className="min-h-screen bg-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => setStep("menu")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Cardápio
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Seu Pedido - Mesa {session?.table?.table_number || tableId}
            </h1>
          </div>

          {cart.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h2>
                <p className="text-gray-500 mb-4">Adicione itens do cardápio para fazer seu pedido</p>
                <Button onClick={() => setStep("menu")} className="bg-orange-600 hover:bg-orange-700">
                  Ver Cardápio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                        <p className="text-orange-600 font-bold">R$ {item.price.toFixed(2)} cada</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`notes-${item.id}`}>Observações</Label>
                      <Textarea
                        id={`notes-${item.id}`}
                        placeholder="Ex: sem cebola, ponto da carne, etc."
                        value={item.notes || ""}
                        onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="mt-4 text-right">
                      <span className="font-bold">Subtotal: R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="p-6">
                  <div>
                    <Label htmlFor="order-notes">Observações do Pedido</Label>
                    <Textarea
                      id="order-notes"
                      placeholder="Observações gerais do pedido..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center text-xl font-bold mb-4">
                    <span>Total do Pedido:</span>
                    <span className="text-orange-600">R$ {getTotalAmount().toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={submitOrder}
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Pedido
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-orange-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-800">Pedido Enviado!</h2>
            <p className="text-gray-600 mb-6">
              Seu pedido foi enviado para a cozinha com sucesso. Você pode acompanhar o status através do botão
              "Acompanhar Pedidos" no cardápio.
            </p>
            <div className="space-y-3">
              <Button onClick={() => setStep("menu")} className="w-full bg-orange-600 hover:bg-orange-700">
                Voltar ao Cardápio
              </Button>
              <Button onClick={() => setStep("orders")} variant="outline" className="w-full">
                Acompanhar Pedidos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "orders") {
    const activeOrders = tableOrders.filter((order) => order.status !== "delivered")
    const completedOrders = tableOrders.filter((order) => order.status === "delivered")

    return (
      <div className="min-h-screen bg-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setStep("menu")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Cardápio
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Acompanhar Pedidos - Mesa {session?.table?.table_number || tableId}
              </h1>
            </div>
            <Button onClick={() => callWaiter("Solicitar conta")} className="bg-blue-600 hover:bg-blue-700">
              <User className="w-4 h-4 mr-2" />
              Chamar para Conta
            </Button>
          </div>

          {/* Pedidos Ativos */}
          {activeOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pedidos em Andamento
              </h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-orange-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(order.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span className="font-medium">
                              {item.quantity}x {item.menu_item.name}
                            </span>
                            <span className="text-gray-600">R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                          <div className="text-sm">
                            <strong>Observações:</strong> {order.notes}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-orange-600">R$ {order.total_amount.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pedidos Concluídos */}
          {completedOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Pedidos Concluídos
              </h2>
              <div className="space-y-4">
                {completedOrders.slice(0, 3).map((order) => (
                  <Card key={order.id} className="opacity-75 border-l-4 border-green-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span>{order.items.length} itens</span>
                        <span className="font-bold">R$ {order.total_amount.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {tableOrders.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h2>
                <p className="text-gray-600 mb-4">Faça seu primeiro pedido através do cardápio!</p>
                <Button onClick={() => setStep("menu")} className="bg-orange-600 hover:bg-orange-700">
                  Ver Cardápio
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Button onClick={() => setStep("menu")} className="bg-orange-600 hover:bg-orange-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Fazer Novo Pedido
            </Button>
            <Button onClick={() => callWaiter("Solicitar garçom")} variant="outline">
              <User className="w-4 h-4 mr-2" />
              Chamar Garçom
            </Button>
            <Link href={`/client/${tableId}/payment`}>
              <Button className="bg-green-600 hover:bg-green-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Fechar Conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
