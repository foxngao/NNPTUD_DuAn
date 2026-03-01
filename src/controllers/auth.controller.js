const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==================== REGISTER ====================
const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if user already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );
    const userId = result.insertId;

    // Assign 'user' role (role_id = 2)
    await db.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, 2)', [userId]);

    // Generate and save OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      'INSERT INTO otp_verifications (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
      [userId, otpCode, expiresAt]
    );

    // Send OTP via email
    try {
      await transporter.sendMail({
        from: `"Car Parts Store" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Xác thực tài khoản - Mã OTP',
        html: `
          <h2>Xin chào ${username}!</h2>
          <p>Mã OTP xác thực tài khoản của bạn là:</p>
          <h1 style="color: #2563eb; letter-spacing: 8px;">${otpCode}</h1>
          <p>Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        `
      });
    } catch (mailErr) {
      console.error('Mail error:', mailErr.message);
      // Vẫn trả về thành công, user có thể request resend OTP
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for OTP verification.',
      data: { userId, username, email }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== VERIFY OTP ====================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp_code } = req.body;

    // Find user by email
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userId = users[0].id;

    // Find valid OTP
    const [otps] = await db.query(
      'SELECT id FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [userId, otp_code]
    );

    if (otps.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Activate user
    await db.query('UPDATE users SET is_active = TRUE WHERE id = ?', [userId]);

    // Delete used OTP
    await db.query('DELETE FROM otp_verifications WHERE user_id = ?', [userId]);

    res.json({ success: true, message: 'Account verified successfully. You can now login.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user with role
    const [users] = await db.query(
      `SELECT u.id, u.username, u.password, u.email, u.full_name, u.is_active, r.name as role
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = users[0];

    // Check if account is activated
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account not verified. Please verify your email first.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { register, verifyOtp, login };
