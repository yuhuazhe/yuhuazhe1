const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '请求方式不允许' });
  }

  try {
    const pendingList = await kv.get('pending_submissions') || [];
    return res.status(200).json({ success: true, data: pendingList });
  } catch (err) {
    return res.status(500).json({ error: '获取数据失败' });
  }
};