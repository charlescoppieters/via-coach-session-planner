import { NextResponse } from 'next/server';
import { invokeClaudeWithBearer } from '@/lib/ai/bedrock-client';

export async function GET() {
  try {
    // Simple test message to verify the connection works
    const response = await invokeClaudeWithBearer(
      [{
        role: 'user',
        content: 'Say hello and confirm you can help with soccer coaching! Keep it brief, just one sentence.'
      }],
      'You are a helpful soccer coaching assistant.',
      'sonnet'  // Use Sonnet 3.5 for testing
    );

    return NextResponse.json({
      success: true,
      response,
      model: 'claude-3-haiku',
      timestamp: new Date().toISOString(),
      message: 'Bedrock connection successful! ✅'
    });
  } catch (error) {
    console.error('Bedrock test failed:', error);

    let errorMessage = 'Unknown error';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide specific error feedback
      if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Check your AWS_BEARER_TOKEN_BEDROCK in .env.local';
        statusCode = 401;
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied. Your token may not have permissions for Claude models.';
        statusCode = 403;
      } else if (error.message.includes('404')) {
        errorMessage = 'Model not found. The Claude model ID may be incorrect.';
        statusCode = 404;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Check your AWS_REGION and internet connection.';
        statusCode = 503;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.toString() : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}