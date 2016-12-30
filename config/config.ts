class SnuttConfig {
    production:string = process.env.SNUTT_PRODUCTION;
    secretKey:string = process.env.SNUTT_SECRET;
    host:string = process.env.SNUTT_HOST;
    port:string = process.env.SNUTT_PORT;
    protocol:string = process.env.SNUTT_PROTOCOL;
    email:string = process.env.SNUTT_EMAIL;
    ssl_key:string = process.env.SNUTT_SSL_KEY;
    ssl_cert:string = process.env.SNUTT_SSL_CERT;
    fcm_api_key:string = process.env.SNUTT_FCM_API_KEY;
    fcm_project_id:string = process.env.SNUTT_FCM_PROJECT_ID;

    SnuttConfig() {
        if (this.production && process.env.NODE_ENV != "mocha")
            process.env.NODE_ENV = "production";
    }
}

export = new SnuttConfig();
