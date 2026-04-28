export async function cleanupGeminiCaches() {
  return {
    mode: 'disabled',
    deleted: 0,
    failed: 0,
    message: 'Gemini context cache is not configured in this build.',
  };
}
