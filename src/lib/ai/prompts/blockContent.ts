import type { GameModelZones, SessionThemeSnapshot } from '@/types/database';
import type { PlayerWithIDPContext } from '@/lib/blockAttendance';

/**
 * Format the game model zones into a readable context string for the LLM
 */
export function formatGameModelContext(gameModel: GameModelZones | null | undefined): string {
  if (!gameModel || !gameModel.zones || gameModel.zones.length === 0) {
    return 'No game model defined.';
  }

  const zoneDescriptions = gameModel.zones.map((zone) => {
    const inPossBlocks = zone.in_possession
      .map((b) => b.name)
      .filter((n) => n)
      .join(', ');
    const outPossBlocks = zone.out_of_possession
      .map((b) => b.name)
      .filter((n) => n)
      .join(', ');

    let description = `${zone.name}:`;
    if (inPossBlocks) {
      description += `\n  - In Possession: ${inPossBlocks}`;
    }
    if (outPossBlocks) {
      description += `\n  - Out of Possession: ${outPossBlocks}`;
    }
    return description;
  });

  return zoneDescriptions.join('\n');
}

/**
 * Format the session theme into a readable context string
 */
export function formatSessionThemeContext(theme: SessionThemeSnapshot | null | undefined): string {
  if (!theme) {
    return 'No specific theme set for this session.';
  }

  const blockTypeLabel = theme.blockType === 'in_possession' ? 'In Possession' : 'Out of Possession';
  return `${theme.zoneName} - ${theme.blockName} (${blockTypeLabel})`;
}

/**
 * Format player IDP context into a readable string for coaching points generation.
 * Only includes players who have active IDPs - players without IDPs are filtered out.
 */
export function formatPlayerIDPContext(players: PlayerWithIDPContext[] | null | undefined): string {
  if (!players || players.length === 0) {
    return '';
  }

  // Filter to only players with active IDPs
  const playersWithIDPs = players.filter((p) => p.idps.length > 0);

  if (playersWithIDPs.length === 0) {
    return '';
  }

  const playerLines = playersWithIDPs.map((player) => {
    const position = player.position ? ` (${player.position})` : '';

    const idpDescriptions = player.idps.map((idp) => {
      const priorityLabel = idp.priority === 1 ? 'primary' : idp.priority === 2 ? 'secondary' : 'tertiary';
      const parts = [idp.attribute_key.replace(/_/g, ' '), priorityLabel];

      // Add urgency/status indicator
      if (idp.days_since_trained === null) {
        parts.push('never trained - INTRODUCE');
      } else if (idp.days_since_trained > 14) {
        parts.push(`${idp.days_since_trained} days since trained - NEEDS ATTENTION`);
      } else if (idp.days_since_trained <= 3) {
        parts.push('recently trained');
      }

      // Add sentiment if feedback exists
      if (idp.positive_mentions > 0 || idp.negative_mentions > 0) {
        if (idp.positive_mentions > idp.negative_mentions) {
          parts.push('positive progress - REINFORCE');
        } else if (idp.negative_mentions > idp.positive_mentions) {
          parts.push('needs improvement');
        }
      }

      // Add training exposure for low counts
      if (idp.training_sessions > 0 && idp.training_sessions <= 3) {
        parts.push(`only ${idp.training_sessions} sessions`);
      }

      return parts.join(', ');
    });

    return `- ${player.name}${position}: ${idpDescriptions.join('; ')}`;
  });

  return `PLAYER DEVELOPMENT FOCUS (only reference if relevant to this drill):
${playerLines.join('\n')}`;
}

/**
 * Build the system prompt for generating drill descriptions
 */
export function buildDescriptionPrompt(
  title: string,
  gameModel: GameModelZones | null | undefined,
  sessionTheme: SessionThemeSnapshot | null | undefined
): string {
  const gameModelContext = formatGameModelContext(gameModel);
  const themeContext = formatSessionThemeContext(sessionTheme);

  return `You are an expert football (soccer) coach in the United Kingdom writing training drill descriptions for grassroots and academy coaches.

CONTEXT:
Session Theme: ${themeContext}

Game Model Structure:
${gameModelContext}

TASK:
Generate a clear, practical drill description for: "${title}"

REQUIREMENTS:
- Include setup details: pitch size recommendations, equipment needed, player organisation
- Describe the activity flow clearly so any coach can run it
- Include 1-2 progressions or variations where appropriate
- Use UK football terminology (pitch not field, match not game, boots not cleats)
- Be concise but comprehensive - match length to drill complexity
- Write in second person instructional style ("Set up...", "Players work in...")
- Focus on practical, actionable instructions
- DO NOT include any coaching points - those are generated separately

STRUCTURE:
1. First, write the drill description (setup, activity flow, progressions)
2. Then, if the session theme or game model are relevant, add a brief "Why this drill?" section that directly quotes or references specific elements from the game model or session theme to justify this drill's inclusion

EXAMPLE FORMAT:
[Drill description here...]

Why this drill?
This activity directly supports today's theme of "[Zone Name] - [Block Name]" by [explanation]. It aligns with our game model principle of "[quote from game model block details]".

OUTPUT:
Provide only the description and justification. Do not include titles like "Description:" or other headers.`;
}

/**
 * Build the system prompt for generating coaching points
 */
export function buildCoachingPointsPrompt(
  title: string,
  description: string,
  gameModel: GameModelZones | null | undefined,
  sessionTheme: SessionThemeSnapshot | null | undefined,
  players?: PlayerWithIDPContext[] | null
): string {
  const gameModelContext = formatGameModelContext(gameModel);
  const themeContext = formatSessionThemeContext(sessionTheme);
  const playerContext = formatPlayerIDPContext(players);

  // Only show player guidance if there are players with active IDPs
  const hasPlayersWithIDPs = playerContext.length > 0;

  return `You are an expert football (soccer) coach in the United Kingdom writing coaching points for grassroots and academy coaches.

CONTEXT:
Session Theme: ${themeContext}

Game Model Structure:
${gameModelContext}
${playerContext ? `\n${playerContext}` : ''}

Drill Title: ${title}

Drill Description:
${description}

TASK:
Generate focused coaching points for this drill.

REQUIREMENTS:
- Focus on what coaches should observe and correct during the drill
- Include a mix of technical, tactical, and decision-making points
- Reference the session theme where relevant to reinforce learning objectives
- Each point should be actionable and specific
- Use bullet points with the bullet character (•)
- Provide 4-8 coaching points (fewer for simple drills, more for complex ones)
- Use UK football terminology
- Write in imperative style ("Look for...", "Encourage...", "Watch for...")
${hasPlayersWithIDPs ? `
PLAYER-SPECIFIC COACHING GUIDANCE:
- CRITICAL: You may ONLY reference players listed in "PLAYER DEVELOPMENT FOCUS" above
- NEVER invent, make up, or hallucinate player names - only use exact names from the list provided
- ONLY include player-specific points if their IDP skills are directly relevant to this drill
- Do NOT mention every player - only those whose development areas match what this drill trains
- If no player IDPs are relevant to this drill, do not include any player-specific points
- When relevant, include 1-3 player-specific coaching points maximum
- Prioritise players marked "NEEDS ATTENTION" (not trained recently on that skill)
- For players marked "REINFORCE" - include praise and maintain good habits
- For players marked "INTRODUCE" - keep expectations appropriate for limited exposure` : ''}

OUTPUT:
Provide only the coaching points as bullet points. Do not include headers or meta-commentary.`;
}

/**
 * Attribute info for outcomes prompt
 */
export interface AttributeOption {
  key: string;
  name: string;
  category: string;
}

/**
 * Build the system prompt for generating block outcomes (first-order or second-order)
 */
export function buildOutcomesPrompt(
  orderType: 'first' | 'second',
  title: string,
  description: string,
  availableAttributes: AttributeOption[]
): string {
  // Group attributes by category for better readability
  const categoryLabels: Record<string, string> = {
    attributes_in_possession: 'In Possession',
    attributes_out_of_possession: 'Out of Possession',
    attributes_physical: 'Physical',
    attributes_psychological: 'Psychological',
  };

  const groupedAttributes: Record<string, AttributeOption[]> = {};
  for (const attr of availableAttributes) {
    const category = attr.category || 'other';
    if (!groupedAttributes[category]) {
      groupedAttributes[category] = [];
    }
    groupedAttributes[category].push(attr);
  }

  // Build the attributes list
  const attributesList = Object.entries(groupedAttributes)
    .map(([category, attrs]) => {
      const label = categoryLabels[category] || category;
      const items = attrs.map((a) => `  - ${a.key} (${a.name})`).join('\n');
      return `${label}:\n${items}`;
    })
    .join('\n\n');

  const orderDescription =
    orderType === 'first'
      ? 'First-order outcomes are the PRIMARY skills this drill DIRECTLY trains. These are the main focus areas that players will actively develop during this activity.'
      : 'Second-order outcomes are SECONDARY skills trained by OTHER participants or as a byproduct. For example, in a shooting drill, goalkeepers train shot-stopping even though the drill focuses on finishing.';

  return `You are selecting training outcomes for a football (soccer) drill.

DRILL:
Title: ${title}

Description:
${description}

TASK:
Select 1 to 3 ${orderType}-order outcomes from the available attributes below.

${orderDescription}

AVAILABLE ATTRIBUTES:
${attributesList}

RULES:
- Return ONLY a JSON array of attribute keys (the values before the parentheses)
- Select between 1 and 3 outcomes that genuinely match the drill
- ONLY use keys from the list above - do NOT invent or make up any keys
- Choose outcomes that are directly relevant to what this drill trains
- If unsure, select fewer outcomes rather than forcing irrelevant ones

OUTPUT FORMAT (JSON array only, no other text):
["key1", "key2", "key3"]`;
}
