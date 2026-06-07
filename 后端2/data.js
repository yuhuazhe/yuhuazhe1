const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        const data = await kv.get('approved_data') || [];
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: '获取数据失败' });
    }
};