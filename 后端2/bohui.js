const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const token = req.headers.authorization?.split(' ')[1];
    if (token !== "admin_verify_token") {
        return res.status(401).json({ error: '无权访问' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '请求方式不允许' });
    }

    const { id } = req.body;
    try {
        let pending = await kv.get('pending_submissions') || [];
        pending = pending.filter(item => item.id !== id);
        await kv.set('pending_submissions', pending);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '操作失败' });
    }
};