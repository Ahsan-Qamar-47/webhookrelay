export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.originalUrl,
    statusCode: 404,
    requestId: req.id || null,
  });
}
