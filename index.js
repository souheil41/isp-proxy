const http = require('http');
const url  = require('url');

const BILLING_HOST = '185.99.220.21';
const BILLING_PORT = 8080;

const server = http.createServer((req, res) => {

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  const options = {
    hostname: BILLING_HOST,
    port:     BILLING_PORT,
    path:     req.url,
    method:   req.method,
    headers:  {
      ...req.headers,
      host: BILLING_HOST + ':' + BILLING_PORT,
    },
  };

  const proxy = http.request(options, (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      ...apiRes.headers,
      'Access-Control-Allow-Origin': '*',
    });
    apiRes.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });

  proxy.setTimeout(15000, () => {
    console.error('Proxy timeout');
    proxy.abort();
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Gateway timeout' }));
  });

  req.pipe(proxy);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ISP Proxy running on port ${PORT}`);
  console.log(`Forwarding to ${BILLING_HOST}:${BILLING_PORT}`);
});
