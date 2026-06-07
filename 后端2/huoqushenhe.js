const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const token = req.headers.authorization?.split(' ')[1];
    if (token !== "admin_verify_token") {
        return res.status(401).json({ error: '无权访问' });
    }

    try {
        const list = await kv.get('pending_submissions') || [];
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: '获取列表失败' });
    }
};