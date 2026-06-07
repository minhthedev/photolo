const authService = require('../services/authService');
const userService = require('../services/userService');

const validatePhotographerInput = ({ username, password }) => {
  if (!username?.trim() || !password) {
    return 'Username and password are required';
  }
  if (password.length < 6) {
    return 'Mật khẩu tối thiểu 6 ký tự';
  }
  if (!/^[a-z0-9_]+$/.test(username.trim().toLowerCase())) {
    return 'Tên đăng nhập chỉ gồm chữ thường, số và dấu _';
  }
  return null;
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const result = await authService.login({
      username: username.trim(),
      password,
    });

    if (!result) {
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    const validationError = validatePhotographerInput({ username, password });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existing = await userService.findByUsername(username.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const result = await authService.register({
      username,
      password,
      displayName,
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    res.status(500).json({ message: 'Đăng ký thất bại', error: error.message });
  }
};

exports.me = async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const row = await userService.findByUsername(payload.username);
  if (!row) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({
    user: {
      id: row.id,
      username: row.username,
      role: row.role,
      displayName: row.display_name,
    },
  });
};

exports.listPhotographers = async (req, res) => {
  try {
    const photographers = await userService.listPhotographers();
    res.json(photographers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch photographers', error: error.message });
  }
};

exports.createPhotographer = async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    const validationError = validatePhotographerInput({ username, password });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existing = await userService.findByUsername(username.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const user = await userService.createPhotographer({
      username,
      password,
      displayName,
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    res.status(500).json({ message: 'Failed to create photographer', error: error.message });
  }
};
