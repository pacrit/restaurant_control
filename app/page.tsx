import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UtensilsCrossed, ChefHat, BarChart3, User } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sistema de Restaurante</h1>
          <p className="text-xl text-gray-600">Escolha sua interface de acesso</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Interface do Cliente */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Cliente</CardTitle>
              <CardDescription>Interface para fazer pedidos na mesa</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Acessar Cardápio</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Interface da Cozinha */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ChefHat className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Cozinha</CardTitle>
              <CardDescription>Gerenciar pedidos e preparação</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/kitchen">
                <Button className="w-full bg-red-600 hover:bg-red-700">Acessar Cozinha</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Interface do Garçom */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Garçom</CardTitle>
              <CardDescription>Gerenciar mesas e atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/waiter">
                <Button className="w-full bg-green-600 hover:bg-green-700">Acessar Painel</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Painel Administrativo */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Administração</CardTitle>
              <CardDescription>Relatórios e gestão financeira</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Acessar Painel</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500">Sistema desenvolvido para otimizar o atendimento e gestão do restaurante</p>
        </div>
      </div>
    </div>
  )
}
