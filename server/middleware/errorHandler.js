export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Not found - ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Mongoose duplicate key (e.g. username already taken)
  if (err?.code === 11000) {
    return res.status(400).json({ message: 'That value is already taken.' });
  }
  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    const msg = Object.values(err.errors || {})[0]?.message || 'Validation failed';
    return res.status(400).json({ message: msg });
  }
  // Bad ObjectId in a path param
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  // Multer upload errors (file too large, etc.)
  if (err?.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10 MB)' : err.message;
    return res.status(400).json({ message: msg });
  }

  const status = err.status || (res.statusCode === 200 ? 500 : res.statusCode) || 500;
  if (status >= 500) console.error('❌', err.stack || err.message);
  res.status(status).json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
