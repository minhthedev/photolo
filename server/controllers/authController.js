const authService = require('../services/authService');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const token = authService.login({
      username: username.trim(),
      password,
    });

    if (!token) {
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    res.json({
      token,
      user: { username: username.trim(), role: 'admin' },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.me = async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({ user: { username: payload.username, role: payload.role } });
};
