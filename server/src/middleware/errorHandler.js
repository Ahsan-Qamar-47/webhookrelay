export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.id || 'N/A'}: ${err.message}`, err.stack);
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    statusCode: status,
    requestId: req.id || null,
  });
}
