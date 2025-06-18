import { sql } from "@/lib/database"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "today"

    let dateFilter = ""
    switch (period) {
      case "today":
        dateFilter = "DATE(created_at) = CURRENT_DATE"
        break
      case "week":
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'"
        break
      case "month":
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'"
        break
      default:
        dateFilter = "DATE(created_at) = CURRENT_DATE"
    }

    // Receita total
    let totalRevenueResult
    try {
      const result = await sql.unsafe(`
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue
        FROM orders 
        WHERE status IN ('delivered', 'ready') AND ${dateFilter}
      `)
      totalRevenueResult = Array.isArray(result) && result.length > 0 ? result[0] : { total_revenue: 0 }
    } catch (error) {
      console.error("Error fetching total revenue:", error)
      totalRevenueResult = { total_revenue: 0 }
    }

    // Receita de hoje
    let todayRevenueResult
    try {
      const result = await sql`
        SELECT COALESCE(SUM(total_amount), 0) as today_revenue
        FROM orders 
        WHERE status IN ('delivered', 'ready') AND DATE(created_at) = CURRENT_DATE
      `
      todayRevenueResult = Array.isArray(result) && result.length > 0 ? result[0] : { today_revenue: 0 }
    } catch (error) {
      console.error("Error fetching today revenue:", error)
      todayRevenueResult = { today_revenue: 0 }
    }

    // Total de pedidos
    let totalOrdersResult
    try {
      const result = await sql.unsafe(`
        SELECT COUNT(*) as total_orders
        FROM orders 
        WHERE ${dateFilter}
      `)
      totalOrdersResult = Array.isArray(result) && result.length > 0 ? result[0] : { total_orders: 0 }
    } catch (error) {
      console.error("Error fetching total orders:", error)
      totalOrdersResult = { total_orders: 0 }
    }

    // Pedidos de hoje
    let todayOrdersResult
    try {
      const result = await sql`
        SELECT COUNT(*) as today_orders
        FROM orders 
        WHERE DATE(created_at) = CURRENT_DATE
      `
      todayOrdersResult = Array.isArray(result) && result.length > 0 ? result[0] : { today_orders: 0 }
    } catch (error) {
      console.error("Error fetching today orders:", error)
      todayOrdersResult = { today_orders: 0 }
    }

    // Ticket médio
    let avgOrderResult
    try {
      const result = await sql.unsafe(`
        SELECT COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM orders 
        WHERE status IN ('delivered', 'ready') AND ${dateFilter}
      `)
      avgOrderResult = Array.isArray(result) && result.length > 0 ? result[0] : { avg_order_value: 0 }
    } catch (error) {
      console.error("Error fetching average order value:", error)
      avgOrderResult = { avg_order_value: 0 }
    }

    // Itens mais vendidos
    let topSellingItems = []
    try {
      const result = await sql.unsafe(`
        SELECT 
          mi.name,
          SUM(oi.quantity) as quantity,
          SUM(oi.quantity * oi.unit_price) as revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('delivered', 'ready') AND ${dateFilter}
        GROUP BY mi.id, mi.name
        ORDER BY quantity DESC
        LIMIT 5
      `)
      topSellingItems = Array.isArray(result) ? result : []
    } catch (error) {
      console.error("Error fetching top selling items:", error)
      topSellingItems = []
    }

    // Pedidos recentes
    let recentOrders = []
    try {
      const result = await sql.unsafe(`
        SELECT 
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          t.table_number
        FROM orders o
        JOIN tables t ON o.table_id = t.id
        WHERE ${dateFilter}
        ORDER BY o.created_at DESC
        LIMIT 10
      `)
      recentOrders = Array.isArray(result) ? result : []
    } catch (error) {
      console.error("Error fetching recent orders:", error)
      recentOrders = []
    }

    // Ensure all values are properly converted to numbers with safe fallbacks
    const stats = {
      totalRevenue: Number.parseFloat(totalRevenueResult?.total_revenue?.toString() || "0"),
      todayRevenue: Number.parseFloat(todayRevenueResult?.today_revenue?.toString() || "0"),
      totalOrders: Number.parseInt(totalOrdersResult?.total_orders?.toString() || "0", 10),
      todayOrders: Number.parseInt(todayOrdersResult?.today_orders?.toString() || "0", 10),
      averageOrderValue: Number.parseFloat(avgOrderResult?.avg_order_value?.toString() || "0"),
      topSellingItems: topSellingItems.map((item) => ({
        name: item?.name?.toString() || "Item desconhecido",
        quantity: Number.parseInt(item?.quantity?.toString() || "0", 10),
        revenue: Number.parseFloat(item?.revenue?.toString() || "0"),
      })),
      recentOrders: recentOrders.map((order) => ({
        id: Number.parseInt(order?.id?.toString() || "0", 10),
        table_number: Number.parseInt(order?.table_number?.toString() || "0", 10),
        total_amount: Number.parseFloat(order?.total_amount?.toString() || "0"),
        status: order?.status?.toString() || "unknown",
        created_at: order?.created_at?.toString() || new Date().toISOString(),
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error)
    // Return a default structure to prevent frontend errors
    return NextResponse.json(
      {
        totalRevenue: 0,
        todayRevenue: 0,
        totalOrders: 0,
        todayOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        recentOrders: [],
      },
      { status: 500 },
    )
  }
}
