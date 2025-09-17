"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  UtensilsCrossed,
  FolderPlus,
  Clock,
  DollarSign,
  EyeOff,
} from "lucide-react"
import Link from "next/link"
import type { MenuItem, MenuCategory } from "@/lib/database"

interface MenuItemWithCategory extends MenuItem {
  category_name: string
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItemWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItemWithCategory | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewItem, setShowNewItem] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, itemsResponse] = await Promise.all([
        fetch("/api/admin/menu/categories"),
        fetch("/api/admin/menu/items"),
      ])

      const categoriesData = await categoriesResponse.json()
      const itemsData = await itemsResponse.json()

      setCategories(categoriesData)
      setItems(itemsData)
    } catch (error) {
      console.error("Erro ao buscar dados do menu:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveCategory = async (category: Partial<MenuCategory>) => {
    try {
      const url = category.id ? `/api/admin/menu/categories/${category.id}` : "/api/admin/menu/categories"
      const method = category.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      })

      if (response.ok) {
        await fetchData()
        setEditingCategory(null)
        setShowNewCategory(false)
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      alert("Erro ao salvar categoria")
    }
  }

  const deleteCategory = async (categoryId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

    try {
      const response = await fetch(`/api/admin/menu/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchData()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      alert("Erro ao excluir categoria")
    }
  }

  const saveItem = async (item: Partial<MenuItemWithCategory>) => {
    try {
      const url = item.id ? `/api/admin/menu/items/${item.id}` : "/api/admin/menu/items"
      const method = item.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (response.ok) {
        await fetchData()
        setEditingItem(null)
        setShowNewItem(false)
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error("Erro ao salvar item:", error)
      alert("Erro ao salvar item")
    }
  }

  const deleteItem = async (itemId: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return

    try {
      const response = await fetch(`/api/admin/menu/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchData()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error("Erro ao excluir item:", error)
      alert("Erro ao excluir item")
    }
  }

  const CategoryForm = ({ category, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      name: category?.name || "",
      description: category?.description || "",
      display_order: category?.display_order || 0,
    })

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nome da Categoria</Label>
              <input
                id="category-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="Ex: Pratos Principais"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria (opcional)"
              />
            </div>
            <div>
              <Label htmlFor="category-order">Ordem de Exibição</Label>
              <input
                id="category-order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => onSave({ ...category, ...formData })} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={onCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ItemForm = ({ item, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      category_id: item?.category_id || categories[0]?.id || 1,
      name: item?.name || "",
      description: item?.description || "",
      price: item?.price || 0,
      preparation_time: item?.preparation_time || 15,
      available: item?.available !== false,
    })

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-category">Categoria</Label>
              <select
                id="item-category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number.parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="item-name">Nome do Item</Label>
              <input
                id="item-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="Ex: Risotto de Camarão"
              />
            </div>
            <div>
              <Label htmlFor="item-description">Descrição</Label>
              <Textarea
                id="item-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do prato"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-price">Preço (R$)</Label>
                <input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="item-time">Tempo de Preparo (min)</Label>
                <input
                  id="item-time"
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: Number.parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="item-available"
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              />
              <Label htmlFor="item-available">Item disponível</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => onSave({ ...item, ...formData })} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={onCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando cardápio...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Editor de Cardápio</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Categorias */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FolderPlus className="w-6 h-6" />
                Categorias
              </h2>
              <Button onClick={() => setShowNewCategory(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </div>

            {showNewCategory && <CategoryForm onSave={saveCategory} onCancel={() => setShowNewCategory(false)} />}

            {editingCategory && (
              <CategoryForm
                category={editingCategory}
                onSave={saveCategory}
                onCancel={() => setEditingCategory(null)}
              />
            )}

            <div className="space-y-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        {category.description && <p className="text-gray-600 text-sm">{category.description}</p>}
                        <p className="text-xs text-gray-500">Ordem: {category.display_order}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingCategory(category)}
                          variant="outline"
                          size="sm"
                          disabled={editingCategory?.id === category.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteCategory(category.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Itens do Menu */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6" />
                Itens do Menu
              </h2>
              <Button onClick={() => setShowNewItem(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
              </Button>
            </div>

            {showNewItem && <ItemForm onSave={saveItem} onCancel={() => setShowNewItem(false)} />}

            {editingItem && <ItemForm item={editingItem} onSave={saveItem} onCancel={() => setEditingItem(null)} />}

            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          {!item.available && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Indisponível
                            </Badge>
                          )}
                        </div>
                        {item.description && <p className="text-gray-600 text-sm mb-2">{item.description}</p>}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R$ {item.price.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.preparation_time} min
                          </span>
                          <Badge variant="outline">{item.category_name}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingItem(item)}
                          variant="outline"
                          size="sm"
                          disabled={editingItem?.id === item.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteItem(item.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
