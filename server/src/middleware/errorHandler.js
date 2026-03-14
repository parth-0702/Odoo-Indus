export function errorHandler(err, _req, res, _next) {
  // Server-side log only
  console.error(err?.stack || err);

  if (res.headersSent) return;

  const isDev = process.env.NODE_ENV !== 'production';
  const msg = isDev ? (err?.message || 'Server error') : 'Server error';
  res.status(500).json({ error: msg });
}
