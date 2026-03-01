const db = require('../config/db');

// GET /api/v1/admin/users
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at, r.name as role
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/v1/admin/users/:id/status
const toggleUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    const [result] = await db.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      message: is_active ? 'User account unlocked' : 'User account locked'
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/admin/stats/revenue?start_date=...&end_date=...
const getRevenueStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    let params = [];

    if (start_date && end_date) {
      dateFilter = 'AND o.order_date BETWEEN ? AND ?';
      params = [start_date, end_date];
    }

    // Total revenue
    const [totalRevenue] = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
              COUNT(*) as total_orders
       FROM orders o
       WHERE o.status IN ('PAID', 'COMPLETED') ${dateFilter}`,
      params
    );

    // Revenue by date
    const [revenueByDate] = await db.query(
      `SELECT DATE(o.order_date) as date,
              SUM(o.total_amount) as revenue,
              COUNT(*) as order_count
       FROM orders o
       WHERE o.status IN ('PAID', 'COMPLETED') ${dateFilter}
       GROUP BY DATE(o.order_date)
       ORDER BY date DESC`,
      params
    );

    // Best-selling parts
    const [bestSelling] = await db.query(
      `SELECT p.id, p.name, p.price,
              SUM(oi.quantity) as total_sold,
              SUM(oi.quantity * oi.price_at_purchase) as total_revenue
       FROM order_items oi
       JOIN parts p ON oi.part_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status IN ('PAID', 'COMPLETED') ${dateFilter}
       GROUP BY p.id, p.name, p.price
       ORDER BY total_sold DESC
       LIMIT 10`,
      params
    );

    // Order status breakdown
    const [statusBreakdown] = await db.query(
      `SELECT status, COUNT(*) as count
       FROM orders ${dateFilter ? 'WHERE order_date BETWEEN ? AND ?' : ''}
       GROUP BY status`,
      params
    );

    res.json({
      success: true,
      data: {
        summary: totalRevenue[0],
        revenue_by_date: revenueByDate,
        best_selling_parts: bestSelling,
        order_status_breakdown: statusBreakdown
      }
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAllUsers, toggleUserStatus, getRevenueStats };
