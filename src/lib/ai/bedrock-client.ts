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

export async function invokeClaudeWithBearer(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  model: 'sonnet' | 'haiku' = 'sonnet'
): Promise<string> {
  const modelId = model === 'sonnet'
    ? 'anthropic.claude-3-5-sonnet-20240620-v1:0'  // Claude 3.5 Sonnet v1
    : 'anthropic.claude-3-haiku-20240307-v1:0';

  const payload: ClaudeRequest = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4000,
    messages,
    temperature: 0.7,
    ...(systemPrompt && { system: systemPrompt })
  };

  // Use invoke API endpoint with bearer token
  const response = await fetch(
    `https://bedrock-runtime.${process.env.AWS_REGION}.amazonaws.com/model/${modelId}/invoke`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bedrock API error: ${response.status} - ${errorText}`);
  }

  const data: ClaudeResponse = await response.json();

  // Extract the text content from Claude's response
  if (data.content && data.content[0]?.text) {
    return data.content[0].text;
  }

  throw new Error('Invalid response format from Claude');
}

// Helper function to build coaching context
export function buildCoachingContext(
  globalRules: Array<{ content: string }>,
  teamRules: Array<{ content: string }>,
  team: {
    name?: string;
    age_group?: string;
    skill_level?: string;
    player_count?: number;
    session_duration?: number;
  } | null
): string {
  const sections = [];

  if (globalRules.length > 0) {
    sections.push(
      'COACHING METHODOLOGY RULES:',
      ...globalRules.map(r => `- ${r.content}`)
    );
  }

  if (teamRules.length > 0) {
    sections.push(
      '',
      'TEAM-SPECIFIC RULES:',
      ...teamRules.map(r => `- ${r.content}`)
    );
  }

  if (team) {
    sections.push(
      '',
      'TEAM PROFILE:',
      `- Team: ${team.name || 'Unknown'}`,
      `- Age Group: ${team.age_group || 'Unknown'}`,
      `- Skill Level: ${team.skill_level || 'Unknown'}`,
      `- Players: ${team.player_count || 0}`,
      `- Session Duration: ${team.session_duration || 60} minutes`
    );
  }

  return sections.join('\n');
}