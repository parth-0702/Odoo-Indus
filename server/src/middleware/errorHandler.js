export function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (res.headersSent) return;

  const msg = err?.message || 'Server error';
  res.status(500).json({ error: msg });
}
