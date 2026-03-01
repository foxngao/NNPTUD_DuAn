const db = require('../config/db');

// POST /api/v1/orders  (create order from cart)
const createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get cart items
    const [cartItems] = await connection.query(
      `SELECT ci.id, ci.part_id, ci.quantity, p.price, p.stock_quantity, p.name
       FROM cart_items ci
       JOIN parts p ON ci.part_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock for all items
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}". Available: ${item.stock_quantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [req.user.id, totalAmount, 'PENDING']
    );
    const orderId = orderResult.insertId;

    // Create order items + decrement stock
    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, part_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [orderId, item.part_id, item.quantity, item.price]
      );
      await connection.query(
        'UPDATE parts SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.part_id]
      );
    }

    // Clear cart
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order_id: orderId, total_amount: totalAmount, status: 'PENDING' }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/orders
const getOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT id, total_amount, status, order_date
       FROM orders WHERE user_id = ?
       ORDER BY order_date DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/orders/:id
const getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.name as part_name, p.image_url
       FROM order_items oi
       JOIN parts p ON oi.part_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...orders[0], items }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createOrder, getOrders, getOrderById };
