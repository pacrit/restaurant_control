"use client"

import { useState, useEffect, useCallback } from "react"

interface TableSession {
  table: {
    id: number
    table_number: number
    status: string
    seats: number
  }
  session: {
    isValid: boolean
    hasActiveOrders: boolean
    hasRecentOrders: boolean
    lastOrderTime?: string
    tokenValid?: boolean
    tokenExpires?: string
  }
}

export function useTableSession(tableId: number, token?: string | null) {
  const [session, setSession] = useState<TableSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const validateSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const url = new URL(`/api/tables/${tableId}/session`, window.location.origin)
      if (token) {
        url.searchParams.set("token", token)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json()
          setError(errorData.reason || "Acesso negado")
        } else if (response.status === 404) {
          setError("Mesa não encontrada")
        } else {
          setError("Erro ao validar sessão")
        }
        return false
      }

      const data = await response.json()
      setSession(data)

      if (!data.session.isValid) {
        if (data.table.status === "needs_attention") {
          setError("Mesa aguardando pagamento - não é possível fazer novos pedidos")
        } else {
          setError("Sessão expirada ou mesa não está mais ativa")
        }
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao validar sessão:", error)
      setError("Erro de conexão")
      return false
    } finally {
      setLoading(false)
    }
  }, [tableId, token])

  const closeSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}/session`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSession(null)
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao fechar sessão:", error)
      return false
    }
  }, [tableId])

  useEffect(() => {
    if (tableId) {
      validateSession()

      // Validar sessão a cada 10 minutos
      const interval = setInterval(validateSession, 10 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [tableId, validateSession])

  // Detectar quando o usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Opcional: fechar sessão quando sair da página
      // closeSession()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Revalidar quando a página volta a ficar visível
        validateSession()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [validateSession])

  return {
    session,
    loading,
    error,
    validateSession,
    closeSession,
    isValid: session?.session.isValid ?? false,
  }
}
