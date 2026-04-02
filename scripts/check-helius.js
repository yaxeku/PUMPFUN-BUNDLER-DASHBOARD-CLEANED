const fetch = require('node-fetch');
(async () => {
  const url = 'https://mainnet.helius-rpc.com/?api-key=4102a03c-c106-4c87-84c7-57ee6aeaf1f0';
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth', params: [] });
  try {
    const r = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
    const j = await r.text();
    console.log('helius status:', r.status, j);
  } catch (e) {
    console.error('helius fetch fail', e.message);
  }
})();