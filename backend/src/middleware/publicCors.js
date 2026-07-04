// The /collect endpoint is hit directly from customer websites (any domain),
// so it needs an open CORS policy - unlike the dashboard API which is locked
// down to the dashboard's own origin.
export function publicCors(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
}
