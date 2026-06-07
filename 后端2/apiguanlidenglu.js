module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '请求方式不允许' });
    }

    const { password } = req.body;
    // 从Vercel环境变量读取管理员密码
    const ADMIN_PWD = process.env.ADMIN_PASSWORD || "123456";

    if (password === ADMIN_PWD) {
        res.status(200).json({ success: true, token: "admin_verify_token" });
    } else {
        res.status(401).json({ error: '密码错误' });
    }
};