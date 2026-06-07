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

    const { id, correctedData } = req.body;
    try {
        let pending = await kv.get('pending_submissions') || [];
        const target = pending.find(item => item.id === id);
        if (!target) return res.status(404).json({ error: '投稿不存在' });

        // 移除待审核
        pending = pending.filter(item => item.id !== id);
        await kv.set('pending_submissions', pending);

        // 加入已发布数据（合并管理员修改内容）
        let approved = await kv.get('approved_data') || [];
        approved.push({ ...target, ...correctedData, approvedAt: new Date().toISOString() });
        await kv.set('approved_data', approved);

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '审核失败' });
    }
};