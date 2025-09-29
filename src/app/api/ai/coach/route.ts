import { NextRequest, NextResponse } from 'next/server';
import { invokeClaudeWithBearer } from '@/lib/ai/bedrock-client';

export async function POST(request: NextRequest) {
  try {
    const {
      session,
      team,
      teamRules,
      globalRules,
      currentContent,
      conversationHistory = [],
      message
    } = await request.json();

    // Validate required fields
    if (!session || !team || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Data is now provided by the client - no need to fetch

    // Build detailed coaching context with clear explanations
    const contextSections = [];

    // Session information
    contextSections.push(`SESSION INFORMATION:
- Session ID: ${session.id} (unique identifier for this training session)
- Title: "${session.title}" (name/description of this session)
- Date: ${session.date} (when this session is scheduled)
- Team ID: ${session.teamId} (which team this session is for)`);

    // Team information
    contextSections.push(`TEAM INFORMATION:
- Team Name: "${team.name}" (the name of the football team)
- Age Group: ${team.ageGroup} (age category like U12, U16, etc.)
- Skill Level: ${team.skillLevel} (beginner/intermediate/advanced)
- Player Count: ${team.playerCount} (number of players in the team)
- Session Duration: ${team.sessionDuration} minutes (typical training session length)`);

    // Global coaching rules
    if (globalRules && globalRules.length > 0) {
      contextSections.push(`GLOBAL COACHING METHODOLOGY RULES:
${globalRules.map((rule: { content: string }) => `- ${rule.content}`).join('\n')}`);
    }

    // Team-specific rules
    if (teamRules && teamRules.length > 0) {
      contextSections.push(`TEAM-SPECIFIC COACHING RULES:
${teamRules.map((rule: { content: string }) => `- ${rule.content}`).join('\n')}`);
    }

    // Conversation context
    contextSections.push(`CONVERSATION CONTEXT:
- Current session plan: The text content of the training session plan being edited
- Conversation history: Previous messages in this coaching chat session for context
- Current request: The coach's specific question or instruction`);

    const coachingContext = contextSections.join('\n\n');

    const systemPrompt = `You are an expert football (soccer) coaching assistant helping UK-based coaches plan training sessions.

${coachingContext}

CRITICAL INSTRUCTIONS:
You MUST analyze the coach's request and determine if it's:
- A QUESTION: Coach is asking for advice, explanation, or information
- A CHANGE REQUEST: Coach wants to modify the session plan

You MUST respond with valid JSON in one of these two formats:

FOR QUESTIONS (no session changes):
{
  "intent": "question",
  "message": "Your answer to the coach's question"
}

FOR CHANGE REQUESTS (modifying the session):
{
  "intent": "change",
  "updated_session": "complete updated session plan in plain text",
  "message": "Specific description of exactly what you changed"
}

RESPONSE RULES:
1. Use "football" not "soccer" (UK terminology)
2. Follow all coaching methodology and team rules listed above
3. Provide age-appropriate activities for ${team.ageGroup}
4. Ensure activities fit within ${team.sessionDuration} minutes
5. For changes: preserve original formatting style exactly
6. For changes: only modify what was specifically requested
7. For questions: provide helpful, specific coaching advice
8. Messages should be concise and professional
9. Never include titles, headers, or explanatory text in updated_session
10. Base all advice on team info: ${team.playerCount} players, ${team.skillLevel} level
11. Always reference the team info and rules in your response
12. When listing items or steps, use clear formatting with newlines between each item for readability
13. Never use a. b. c. lists, try to only use '-' and numbers for main items
14. In the response message, if there are numbered lists, do not put a blank line (double new line) between the numbers and the items or between the numbers and the next list item

EXAMPLES:

Coach asks: "What's a good warm-up for U12s?"
Response: {"intent": "question", "message": "For U12 players, I recommend this warm-up structure:\n\n1. Light jogging around the pitch (3-4 minutes)\n2. Dynamic stretches - leg swings, high knees, heel kicks\n3. Ball work - passing in pairs (short distances)\n4. Cone dribbling - simple touches to get feel for the ball\n5. Light movement games to engage them mentally\n\nThis builds from basic movement to football-specific skills. Would you like me to add this to your session plan?"}

Coach says: "Add a 10-minute warm-up at the start"
Response: {"intent": "change", "updated_session": "[complete updated session with warm-up added]", "message": "Added a 10-minute warm-up section at the beginning with light jogging, dynamic stretches, and ball work."}

You MUST respond with valid JSON only - no other text before or after. Do not include any explanatory text, introductions, or commentary outside of the JSON structure. Start your response immediately with the opening curly brace { and end with the closing curly brace }.

CRITICAL: In the JSON message field, you MUST use \\n for line breaks, NOT actual newline characters. The JSON must be properly escaped and parseable by JSON.parse().`;

    // Build messages array from conversation history
    const messages = [
      ...conversationHistory.map((msg: { type: string; content: string }) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: `Current session plan:\n\n${currentContent}\n\nUser request: ${message}`
      }
    ];

    // Call Claude with Sonnet for complex planning
    const aiResponse = await invokeClaudeWithBearer(
      messages,
      systemPrompt,
      'sonnet'
    );

    // Parse the AI response
    let parsedResponse;
    try {
      if (typeof aiResponse === 'object') {
        parsedResponse = aiResponse;
      } else {
        // Extract JSON from response - handle code blocks or plain JSON
        let jsonStr = aiResponse.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '').trim();
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '').trim();
        }

        parsedResponse = JSON.parse(jsonStr);
      }
    } catch (error) {
      console.error('Failed to parse AI response:', aiResponse);
      console.error('Type:', typeof aiResponse);
      console.error('JSON parse error:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid AI response format'
      }, { status: 500 });
    }

    if (!parsedResponse.intent || !parsedResponse.message) {
      console.error('Invalid AI response structure:', parsedResponse);
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 500 });
    }

    // Additional validation for change requests
    if (parsedResponse.intent === 'change' && !parsedResponse.updated_session) {
      console.error('Missing updated_session for change request:', parsedResponse);
      return NextResponse.json({
        success: false,
        error: 'Missing session content for change request'
      }, { status: 500 });
    }

    // Log usage for tracking
    console.info('AI Coach request completed', {
      teamId: session.teamId,
      teamName: team.name,
      messageLength: message.length,
      intent: parsedResponse.intent,
      model: 'claude-3.5-sonnet',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      intent: parsedResponse.intent,
      message: parsedResponse.message,
      ...(parsedResponse.intent === 'change' && { updatedPlan: parsedResponse.updated_session }),
      usage: {
        model: 'claude-3.5-sonnet',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Coach error:', error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Authentication failed. Please check your Bedrock credentials.' },
          { status: 401 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}