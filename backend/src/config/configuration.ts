export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/teams-meeting-summarizer',
  },

  azure: {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3001/auth/callback',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    },
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    local: {
      path: process.env.LOCAL_STORAGE_PATH || './uploads',
    },
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'teams-meeting-recordings',
    },
    azureBlob: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      container: process.env.AZURE_STORAGE_CONTAINER || 'recordings',
    },
  },

  bot: {
    // The public URL where your backend is reachable (ngrok for local dev)
    callbackBaseUrl: process.env.BOT_CALLBACK_URL || 'https://your-ngrok-url.ngrok-free.app/api',
    // Azure Bot Service app ID (can be same as AZURE_CLIENT_ID or separate)
    appId: process.env.BOT_APP_ID || process.env.AZURE_CLIENT_ID,
    appSecret: process.env.BOT_APP_SECRET || process.env.AZURE_CLIENT_SECRET,
    tenantId: process.env.BOT_TENANT_ID || process.env.AZURE_TENANT_ID,
  },

  speech: {
    provider: process.env.SPEECH_PROVIDER || 'mock',
    whisperApiUrl: process.env.WHISPER_API_URL || 'http://localhost:9000/asr',
  },
});
