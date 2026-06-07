const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // 1. 强制设置跨域头，解决预检请求问题
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. 处理 OPTIONS 预检请求（浏览器发POST前会先发这个）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 只允许 POST 请求，直接返回405
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '请求方式不允许' });
  }

  // 4. 关键修复：手动解析 JSON 请求体（Vercel 默认不解析）
  let body;
  try {
    // 处理不同情况的请求体
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
  } catch (err) {
    return res.status(400).json({ error: '请求体格式错误，必须是JSON' });
  }

  // 5. 从解析后的body中拿数据
  const { nickname, team, gold, dps, videoUrl } = body;

  // 6. 校验必填项（修正了0被当成空值的问题）
  if (!nickname || !team || gold === undefined || gold === null || isNaN(gold) || dps === undefined || dps === null || isNaN(dps)) {
    return res.status(400).json({ error: '必填项不能为空或格式错误' });
  }

  try {
    // 7. 读取KV存储并写入数据
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

    // 8. 返回成功响应（让前端res.ok为true）
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('提交失败：', err);
    return res.status(500).json({ error: '服务器错误，提交失败' });
  }
};