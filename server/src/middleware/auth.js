const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decodedToken.uid).lean();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    if ((decodedToken.token_version || 0) !== (user.token_version || 0)) {
      if (user.account_status === 'banned') {
        return res.status(403).json({
          error: user.ban_reason
            ? `Your account has been banned: ${user.ban_reason}`
            : 'Your account has been banned. Contact an admin for help.',
          account_status: 'banned',
        });
      }

      if (user.account_status === 'restricted') {
        return res.status(403).json({
          error: user.ban_reason
            ? `Your account is restricted: ${user.ban_reason}`
            : 'Your account is restricted. Contact an admin for help.',
          account_status: 'restricted',
        });
      }

      return res.status(401).json({ error: 'Unauthorized: Session expired' });
    }

    req.user = {
      uid: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role || 'user',
      account_status: user.account_status || 'active',
      token_version: user.token_version || 0,
    };

    req.userDoc = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  return next();
};

const requireActiveUser = (req, res, next) => {
  const accountStatus = req.user?.account_status || 'active';
  if (accountStatus !== 'active') {
    const reason = req.userDoc?.ban_reason;

    if (accountStatus === 'banned') {
      return res.status(403).json({
        error: reason
          ? `Your account has been banned: ${reason}`
          : 'Your account has been banned. Contact an admin for help.',
        account_status: accountStatus,
      });
    }

    if (accountStatus === 'restricted') {
      return res.status(403).json({
        error: reason
          ? `Your account is restricted: ${reason}`
          : 'Your account is restricted. Contact an admin for help.',
        account_status: accountStatus,
      });
    }

    return res.status(403).json({
      error: 'Your account cannot perform this action',
      account_status: accountStatus,
    });
  }

  return next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireActiveUser,
};
