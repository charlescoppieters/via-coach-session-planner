// Alternative Bedrock client using AWS SDK v3 with IAM credentials
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  anthropic_version: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
  system?: string;
}

interface ClaudeResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Initialize Bedrock client with IAM credentials
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function invokeClaudeWithSDK(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  model: 'sonnet' | 'haiku' = 'sonnet'
): Promise<string> {
  const modelId = model === 'sonnet'
    ? 'anthropic.claude-3-5-sonnet-20240620-v1:0'
    : 'anthropic.claude-3-haiku-20240307-v1:0';

  const payload: ClaudeRequest = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4000,
    messages,
    temperature: 0.7,
    ...(systemPrompt && { system: systemPrompt })
  };

  const command = new InvokeModelCommand({
    modelId,
    body: JSON.stringify(payload),
    contentType: 'application/json',
    accept: 'application/json',
  });

  try {
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const data: ClaudeResponse = responseBody;

    // Extract the text content from Claude's response
    if (data.content && data.content[0]?.text) {
      return data.content[0].text;
    }

    throw new Error('Invalid response format from Claude');
  } catch (error) {
    console.error('Bedrock SDK error:', error);
    throw error;
  }
}

// Re-export the helper function
export { buildCoachingContext } from './bedrock-client';