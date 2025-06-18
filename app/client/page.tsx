"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingCart, Plus, Minus, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { MenuItem, MenuCategory, Table } from "@/lib/database"

interface CartItem extends MenuItem {
  quantity: number
  notes?: string
}

export default function ClientPage() {
  const [step, setStep] = useState<"table" | "menu" | "cart" | "confirmation">("table")
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [orderNotes, setOrderNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTables()
    fetchCategories()
    fetchMenuItems()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables")
      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error("Erro ao buscar mesas:", error)
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
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu/items")
      const data = await response.json()
      // Convert price strings to numbers
      const itemsWithNumericPrices = data.map((item: any) => ({
        ...item,
        price: Number.parseFloat(item.price),
      }))
      setMenuItems(itemsWithNumericPrices)
    } catch (error) {
      console.error("Erro ao buscar itens do menu:", error)
    }
  }

  const addToCart = (item: MenuItem) => {
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
  }

  const updateCartItemQuantity = (itemId: number, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter((item) => item.id !== itemId))
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
    if (!selectedTable || cart.length === 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_id: selectedTable,
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
      } else {
        alert("Erro ao enviar pedido. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao enviar pedido:", error)
      alert("Erro ao enviar pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item) => item.category_id === selectedCategory && item.available)
    : menuItems.filter((item) => item.available)

  if (step === "table") {
    return (
      <div className="min-h-screen bg-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Selecione sua Mesa</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTable === table.table_number
                    ? "ring-2 ring-orange-500 bg-orange-100"
                    : table.status === "available"
                      ? "hover:bg-gray-50"
                      : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (table.status === "available") {
                    setSelectedTable(table.table_number)
                  }
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold mb-2">Mesa {table.table_number}</div>
                  <div className="text-sm text-gray-600 mb-2">{table.seats} lugares</div>
                  <Badge
                    variant={table.status === "available" ? "default" : "secondary"}
                    className={table.status === "available" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {table.status === "available" ? "Disponível" : "Ocupada"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedTable && (
            <div className="mt-8 text-center">
              <Button onClick={() => setStep("menu")} className="bg-orange-600 hover:bg-orange-700" size="lg">
                Continuar para o Cardápio
              </Button>
            </div>
          )}
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
              <Button variant="outline" size="sm" onClick={() => setStep("table")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Cardápio - Mesa {selectedTable}</h1>
            </div>
            <Button
              onClick={() => setStep("cart")}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={cart.length === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Carrinho ({cart.length})
            </Button>
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
                    <Button onClick={() => addToCart(item)} className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Seu Pedido - Mesa {selectedTable}</h1>
          </div>

          {cart.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
                <Button onClick={() => setStep("menu")}>Voltar ao Cardápio</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                        <p className="text-orange-600 font-bold">R$ {item.price.toFixed(2)} cada</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
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

              <Card className="bg-orange-100">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total do Pedido:</span>
                    <span className="text-orange-600">R$ {getTotalAmount().toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={submitOrder}
                    disabled={loading}
                    className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? "Enviando..." : "Enviar Pedido"}
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
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Pedido Enviado!</h2>
            <p className="text-gray-600 mb-6">
              Seu pedido foi enviado para a cozinha. Você pode acompanhar o status aqui na mesa.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setStep("table")
                  setSelectedTable(null)
                }}
                className="w-full"
                variant="outline"
              >
                Fazer Novo Pedido
              </Button>
              <Link href="/">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Voltar ao Início</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
