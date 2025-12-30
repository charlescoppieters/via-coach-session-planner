import { NextRequest, NextResponse } from 'next/server';
import { invokeClaudeWithBearer } from '@/lib/ai/bedrock-client';
import { buildDescriptionPrompt, buildCoachingPointsPrompt, buildOutcomesPrompt, type AttributeOption } from '@/lib/ai/prompts/blockContent';
import type { GameModelZones, SessionThemeSnapshot } from '@/types/database';
import type { PlayerWithIDPContext } from '@/lib/blockAttendance';

interface GenerateBlockContentRequest {
  type: 'description' | 'coaching_points' | 'first_order_outcomes' | 'second_order_outcomes';
  title: string;
  description?: string; // Required for coaching_points and outcomes
  gameModel?: GameModelZones | null;
  sessionTheme?: SessionThemeSnapshot | null;
  players?: PlayerWithIDPContext[] | null; // For coaching points with player IDP context
  availableAttributes?: AttributeOption[] | null; // For outcomes generation
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateBlockContentRequest = await request.json();

    const { type, title, description, gameModel, sessionTheme, players, availableAttributes } = body;

    // Validate required fields
    if (!type || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type and title are required' },
        { status: 400 }
      );
    }

    const validTypes = ['description', 'coaching_points', 'first_order_outcomes', 'second_order_outcomes'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type: must be one of ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // For coaching points, description is required
    if (type === 'coaching_points' && !description) {
      return NextResponse.json(
        { success: false, error: 'Description is required when generating coaching points' },
        { status: 400 }
      );
    }

    // For outcomes, description and availableAttributes are required
    const isOutcomesType = type === 'first_order_outcomes' || type === 'second_order_outcomes';
    if (isOutcomesType) {
      if (!description) {
        return NextResponse.json(
          { success: false, error: 'Description is required when generating outcomes' },
          { status: 400 }
        );
      }
      if (!availableAttributes || availableAttributes.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Available attributes are required when generating outcomes' },
          { status: 400 }
        );
      }
    }

    // Build the appropriate prompt
    let systemPrompt: string;
    let userMessage: string;

    if (type === 'description') {
      systemPrompt = buildDescriptionPrompt(title, gameModel, sessionTheme);
      userMessage = `Generate a training drill description for: "${title}"`;
    } else if (type === 'coaching_points') {
      systemPrompt = buildCoachingPointsPrompt(title, description!, gameModel, sessionTheme, players);
      userMessage = `Generate coaching points for the drill: "${title}"`;
    } else {
      // Outcomes generation
      const orderType = type === 'first_order_outcomes' ? 'first' : 'second';
      systemPrompt = buildOutcomesPrompt(orderType, title, description!, availableAttributes!);
      userMessage = `Select ${orderType}-order outcomes for the drill: "${title}"`;
    }

    // Call Claude - use Haiku for faster, cheaper generation of short content
    const messages = [
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    const aiResponse = await invokeClaudeWithBearer(
      messages,
      systemPrompt,
      'haiku' // Use Haiku for faster generation
    );

    // Clean up the response - remove any markdown formatting if present
    let content = aiResponse.trim();

    // Remove markdown code blocks if AI wrapped the response
    if (content.startsWith('```')) {
      content = content.replace(/```[a-z]*\n?/g, '').replace(/\n?```$/g, '').trim();
    }

    // For outcomes, parse and validate the JSON response
    let outcomes: string[] | undefined;
    if (isOutcomesType) {
      try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error('Response is not an array');
        }

        // Filter to only valid attribute keys
        const validKeys = new Set(availableAttributes!.map((a) => a.key));
        outcomes = parsed
          .filter((key): key is string => typeof key === 'string' && validKeys.has(key))
          .slice(0, 3); // Limit to 3 max

        if (outcomes.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No valid outcomes were generated. Please try again.' },
            { status: 422 }
          );
        }
      } catch (parseError) {
        console.error('Failed to parse outcomes response:', content, parseError);
        return NextResponse.json(
          { success: false, error: 'Failed to parse AI response. Please try again.' },
          { status: 422 }
        );
      }
    }

    // Log usage for tracking
    console.info('Block content generation completed', {
      type,
      title,
      hasGameModel: !!gameModel,
      hasSessionTheme: !!sessionTheme,
      playerCount: players?.length || 0,
      outcomesCount: outcomes?.length,
      model: 'claude-3-haiku',
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      content,
      ...(outcomes && { outcomes })
    });

  } catch (error) {
    console.error('Block content generation error:', error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { success: false, error: 'Authentication failed. Please check your Bedrock credentials.' },
          { status: 401 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
