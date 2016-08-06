var config = {
    production: process.env.SNUTT_PRODUCTION,
    secretKey: process.env.SNUTT_SECRET,
    host: process.env.SNUTT_HOST,
    port: process.env.SNUTT_PORT,
    protocol: process.env.SNUTT_PROTOCOL,
    email: process.env.SNUTT_EMAIL,
    ssl_key: process.env.SNUTT_SSL_KEY,
    ssl_cert: process.env.SNUTT_SSL_CERT
};

if (config.production && process.env.NODE_ENV != "mocha")
    process.env.NODE_ENV = "production";

module.exports = config;