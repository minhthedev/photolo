const crypto = require('crypto');
const userService = require('./userService');

const getSecret = () => process.env.JWT_SECRET || 'photo-selection-dev-secret';

const toBase64Url = (value) => Buffer.from(value).toString('base64url');

const fromBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

exports.login = async ({ username, password }) => {
  const user = await userService.authenticate(username.trim().toLowerCase(), password);
  if (!user) return null;

  return {
    token: exports.createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    }),
    user,
  };
};

exports.register = async ({ username, password, displayName }) => {
  const user = await userService.createPhotographer({
    username,
    password,
    displayName,
  });

  return {
    token: exports.createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    }),
    user,
  };
};

exports.createToken = (payload) => {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  );
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
};

exports.verifyToken = (token) => {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;

    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expected) return null;

    const payload = JSON.parse(fromBase64Url(body));
    if (!payload.exp || payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
};
