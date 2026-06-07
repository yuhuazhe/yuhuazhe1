const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // 跨域头必须设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '请求方式不允许' });
  }

  // ✅ 关键：强制解析 JSON 请求体
  let body;
  try {
    // 兼容不同情况的请求体
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: '请求体格式错误，必须是JSON' });
  }

  // 从解析后的 body 中取数据
  const { nickname, team, gold, dps, videoUrl } = body;

  // 校验（0 也视为合法值）
  if (!nickname || !team || gold === undefined || gold === null || isNaN(gold) || dps === undefined || dps === null || isNaN(dps)) {
    return res.status(400).json({ error: '必填项不能为空或格式错误' });
  }

  try {
    let pendingList = await kv.get('pending_submissions') || [];
    pendingList.push({
      id: Date.now(),
      nickname,
      team,
      gold,
      dps,
      videoUrl: videoUrl || '',
      createdAt: new Date().toISOString()
    });
    await kv.set('pending_submissions', pendingList);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '提交失败' });
  }
};