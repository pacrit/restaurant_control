"use client"

import { useState, useEffect, useCallback } from "react"
import type { Table } from "@/lib/database"

interface SessionData {
  table: Table
  session: {
    tableId: number
    isValid: boolean
    wasOccupied: boolean
  }
}

export function useTableSession(tableId: number) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)

  const validateSession = useCallback(async () => {
    if (!tableId) return false

    try {
      const response = await fetch(`/api/tables/${tableId}/session`)

      if (response.ok) {
        const data = await response.json()
        setSession(data)
        setIsValid(true)
        setError(null)
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Erro ao validar sessão")
        setIsValid(false)
        return false
      }
    } catch (err) {
      console.error("Erro na validação:", err)
      setError("Erro de conexão")
      setIsValid(false)
      return false
    }
  }, [tableId])

  useEffect(() => {
    const initSession = async () => {
      setLoading(true)
      await validateSession()
      setLoading(false)
    }

    if (tableId) {
      initSession()
    }
  }, [tableId, validateSession])

  return {
    session,
    loading,
    error,
    isValid,
    validateSession,
  }
}
