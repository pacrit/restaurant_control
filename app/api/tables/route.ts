import { sql } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const tables = await sql`
      SELECT * FROM tables 
      ORDER BY table_number
    `

    return NextResponse.json(tables)
  } catch (error) {
    console.error("Erro ao buscar mesas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
