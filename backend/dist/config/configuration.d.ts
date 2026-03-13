declare const _default: () => {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    mongodb: {
        uri: string;
    };
    azure: {
        tenantId: string | undefined;
        clientId: string | undefined;
        clientSecret: string | undefined;
        redirectUri: string;
    };
    ai: {
        provider: string;
        openai: {
            apiKey: string | undefined;
            model: string;
        };
        anthropic: {
            apiKey: string | undefined;
            model: string;
        };
    };
    storage: {
        provider: string;
        local: {
            path: string;
        };
        s3: {
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
            region: string;
            bucket: string;
        };
        azureBlob: {
            connectionString: string | undefined;
            container: string;
        };
    };
    speech: {
        provider: string;
        whisperApiUrl: string;
    };
};
export default _default;
