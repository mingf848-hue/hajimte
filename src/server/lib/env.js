function readStringEnv(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const hasMatchingQuotes = (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  );

  return hasMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

export const env = {
  PORT: Number(process.env.PORT || 8080),
  CORS_ORIGIN: readStringEnv('CORS_ORIGIN'),
  MONGODB_URI: readStringEnv('MONGODB_URI'),
  GEMINI_API_KEY: readStringEnv('GEMINI_API_KEY'),
  GEMINI_MODEL: readStringEnv('GEMINI_MODEL', 'gemini-3.1-flash-lite-preview'),
  GEMINI_EMBEDDING_MODEL: readStringEnv('GEMINI_EMBEDDING_MODEL', 'models/gemini-embedding-001'),
  GEMINI_CACHE_TTL_SECONDS: 3600,
  GEMINI_PROXY_TIMEOUT_MS: Number(process.env.GEMINI_PROXY_TIMEOUT_MS || 55000),
  GEMINI_CACHE_MIN_CHARS: Number(process.env.GEMINI_CACHE_MIN_CHARS || 2000),
  RAG_TEXT_RESULT_LIMIT: Number(process.env.RAG_TEXT_RESULT_LIMIT || 8),
  RAG_VECTOR_RESULT_LIMIT: Number(process.env.RAG_VECTOR_RESULT_LIMIT || 8),
  RAG_FINAL_RESULT_LIMIT: Number(process.env.RAG_FINAL_RESULT_LIMIT || 6),
  RAG_VECTOR_CANDIDATES: Number(process.env.RAG_VECTOR_CANDIDATES || 60),
  RAG_VECTOR_INDEX_NAME: readStringEnv('RAG_VECTOR_INDEX_NAME', 'knowledge_units_vector'),
  RAG_SEARCH_INDEX_NAME: readStringEnv('RAG_SEARCH_INDEX_NAME', 'knowledge_units_search'),
  SESSION_SECRET: readStringEnv('SESSION_SECRET', 'hajimi-dev-session-secret'),
  SESSION_EXPIRES_IN: readStringEnv('SESSION_EXPIRES_IN', '12h'),
  API_RATE_LIMIT_WINDOW_MS: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000),
  API_RATE_LIMIT_MAX: Number(process.env.API_RATE_LIMIT_MAX || 30),
  S3_BUCKET: readStringEnv('S3_BUCKET'),
  S3_REGION: readStringEnv('S3_REGION', 'auto'),
  S3_ENDPOINT: readStringEnv('S3_ENDPOINT'),
  S3_ACCESS_KEY_ID: readStringEnv('S3_ACCESS_KEY_ID'),
  S3_SECRET_ACCESS_KEY: readStringEnv('S3_SECRET_ACCESS_KEY'),
  S3_PUBLIC_BASE_URL: readStringEnv('S3_PUBLIC_BASE_URL'),
  STORAGE_MODE: readStringEnv('STORAGE_MODE'),
};
