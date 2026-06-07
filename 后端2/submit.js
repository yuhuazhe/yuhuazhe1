const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '请求方式不允许' });
    }

    const { nickname, team, gold, dps, videoUrl } = req.body;
    if (!nickname || !team || !gold || !dps) {
        return res.status(400).json({ error: '必填项不能为空' });
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
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '提交失败' });
    }
};