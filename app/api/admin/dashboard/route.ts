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
    const [totalRevenueResult] = await sql.unsafe(`
      SELECT COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders 
      WHERE status IN ('delivered', 'ready') AND ${dateFilter}
    `)

    // Receita de hoje
    const [todayRevenueResult] = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as today_revenue
      FROM orders 
      WHERE status IN ('delivered', 'ready') AND DATE(created_at) = CURRENT_DATE
    `

    // Total de pedidos
    const [totalOrdersResult] = await sql.unsafe(`
      SELECT COUNT(*) as total_orders
      FROM orders 
      WHERE ${dateFilter}
    `)

    // Pedidos de hoje
    const [todayOrdersResult] = await sql`
      SELECT COUNT(*) as today_orders
      FROM orders 
      WHERE DATE(created_at) = CURRENT_DATE
    `

    // Ticket médio
    const [avgOrderResult] = await sql.unsafe(`
      SELECT COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders 
      WHERE status IN ('delivered', 'ready') AND ${dateFilter}
    `)

    // Itens mais vendidos
    const topSellingItems = await sql.unsafe(`
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

    // Pedidos recentes
    const recentOrders = await sql.unsafe(`
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

    // Ensure all values are properly converted to numbers
    const stats = {
      totalRevenue: Number.parseFloat(totalRevenueResult?.total_revenue || "0"),
      todayRevenue: Number.parseFloat(todayRevenueResult?.today_revenue || "0"),
      totalOrders: Number.parseInt(totalOrdersResult?.total_orders || "0", 10),
      todayOrders: Number.parseInt(todayOrdersResult?.today_orders || "0", 10),
      averageOrderValue: Number.parseFloat(avgOrderResult?.avg_order_value || "0"),
      topSellingItems: Array.isArray(topSellingItems)
        ? topSellingItems.map((item) => ({
            name: item.name || "Item desconhecido",
            quantity: Number.parseInt(item.quantity || "0", 10),
            revenue: Number.parseFloat(item.revenue || "0"),
          }))
        : [],
      recentOrders: Array.isArray(recentOrders)
        ? recentOrders.map((order) => ({
            id: order.id,
            table_number: order.table_number,
            total_amount: Number.parseFloat(order.total_amount || "0"),
            status: order.status || "unknown",
            created_at: order.created_at,
          }))
        : [],
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
