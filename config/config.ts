class SnuttConfig {
    production = process.env.SNUTT_PRODUCTION;
    secretKey = process.env.SNUTT_SECRET;
    host = process.env.SNUTT_HOST;
    port = process.env.SNUTT_PORT;
    protocol = process.env.SNUTT_PROTOCOL;
    email = process.env.SNUTT_EMAIL;
    ssl_key = process.env.SNUTT_SSL_KEY;
    ssl_cert = process.env.SNUTT_SSL_CERT;
    fcm_api_key = process.env.SNUTT_FCM_API_KEY;
    fcm_project_id = process.env.SNUTT_FCM_PROJECT_ID;

    SnuttConfig() {
        if (this.production && process.env.NODE_ENV != "mocha")
            process.env.NODE_ENV = "production";
    }
}

export let config = new SnuttConfig();
