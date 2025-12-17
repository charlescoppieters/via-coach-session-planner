import type { PlayerReportData, PlayerReportIDP } from './playerReportData'
import type { PlayerTrainingBalance } from '@/types/database'

// Category colors matching FA's Four Corners model
const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  attributes_in_possession: { color: '#3b82f6', label: 'In Possession' },
  attributes_out_of_possession: { color: '#ef4444', label: 'Out of Possession' },
  attributes_physical: { color: '#22c55e', label: 'Physical' },
  attributes_psychological: { color: '#a855f7', label: 'Psychological' },
}

const CATEGORY_ORDER = [
  'attributes_in_possession',
  'attributes_out_of_possession',
  'attributes_psychological',
  'attributes_physical',
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'Primary'
    case 2:
      return 'Secondary'
    case 3:
      return 'Tertiary'
    default:
      return `Priority ${priority}`
  }
}

/**
 * Generate SVG radar chart for training balance
 */
function generateRadarChartSVG(balance: PlayerTrainingBalance[]): string {
  if (!balance || balance.length === 0) {
    return `
      <div style="padding: 40px; text-align: center; color: #6b7280; background: #1a1a1a; border-radius: 8px;">
        No training balance data available
      </div>
    `
  }

  // Calculate totals and percentages
  const totalOpportunities = balance.reduce((sum, b) => sum + b.total_opportunities, 0)

  // Prepare data in the correct order for the radar chart
  const radarData = CATEGORY_ORDER.map((categoryKey) => {
    const category = balance.find((b) => b.category === categoryKey)
    const value = category?.total_opportunities || 0
    const percentage = totalOpportunities > 0 ? (value / totalOpportunities) * 100 : 0
    return {
      category: categoryKey,
      value,
      percentage,
    }
  }).filter((d) => CATEGORY_CONFIG[d.category])

  // SVG dimensions
  const size = 300
  const center = size / 2
  const radius = 120
  const levels = 4

  // Calculate points for each axis
  const getPoint = (index: number, value: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * index) / radarData.length - Math.PI / 2
    const distance = (value / 100) * radius
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    }
  }

  // Get label position
  const getLabelPoint = (index: number): { x: number; y: number; anchor: string } => {
    const angle = (Math.PI * 2 * index) / radarData.length - Math.PI / 2
    const distance = radius + 25
    const x = center + distance * Math.cos(angle)
    const y = center + distance * Math.sin(angle)
    let anchor = 'middle'
    if (Math.abs(Math.cos(angle)) > 0.3) {
      anchor = Math.cos(angle) > 0 ? 'start' : 'end'
    }
    return { x, y, anchor }
  }

  // Generate polygon points for data shape
  const dataPoints = radarData.map((d, i) => getPoint(i, d.percentage))
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Generate grid lines
  const gridLines = Array.from({ length: levels }, (_, i) => {
    const levelPercentage = ((i + 1) / levels) * 100
    const points = radarData.map((_, idx) => getPoint(idx, levelPercentage))
    return points.map((p) => `${p.x},${p.y}`).join(' ')
  })

  // Build SVG
  let svg = `<svg viewBox="0 0 ${size} ${size}" style="width: 100%; max-width: 300px; height: auto;">`

  // Grid polygons
  gridLines.forEach((points) => {
    svg += `<polygon points="${points}" fill="none" stroke="#374151" stroke-width="1" opacity="0.5"/>`
  })

  // Axis lines
  radarData.forEach((_, i) => {
    const endPoint = getPoint(i, 100)
    svg += `<line x1="${center}" y1="${center}" x2="${endPoint.x}" y2="${endPoint.y}" stroke="#374151" stroke-width="1" opacity="0.5"/>`
  })

  // Data polygon
  svg += `<polygon points="${polygonPoints}" fill="#efbf04" fill-opacity="0.2" stroke="#efbf04" stroke-width="2"/>`

  // Data points
  dataPoints.forEach((point, i) => {
    const color = CATEGORY_CONFIG[radarData[i].category]?.color || '#efbf04'
    svg += `<circle cx="${point.x}" cy="${point.y}" r="5" fill="${color}" stroke="#1a1a1a" stroke-width="2"/>`
  })

  // Labels
  radarData.forEach((d, i) => {
    const labelPos = getLabelPoint(i)
    const config = CATEGORY_CONFIG[d.category]
    svg += `<text x="${labelPos.x}" y="${labelPos.y}" text-anchor="${labelPos.anchor}" dominant-baseline="middle" fill="${config?.color || '#fff'}" font-size="10" font-weight="600">${config?.label || d.category}</text>`
  })

  // Center point
  svg += `<circle cx="${center}" cy="${center}" r="3" fill="#374151"/>`

  svg += '</svg>'

  return svg
}

/**
 * Generate HTML for a single IDP section
 */
function generateIDPSection(idp: PlayerReportIDP, isHistorical: boolean): string {
  const statusColor = isHistorical ? '#6b7280' : '#efbf04'
  const dateRange = isHistorical
    ? `${formatDate(idp.started_at)} - ${formatDate(idp.ended_at!)}`
    : `Started ${formatDate(idp.started_at)}`

  return `
    <div style="margin-bottom: 24px; page-break-inside: avoid;">
      <!-- IDP Header -->
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${statusColor};">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; flex-shrink: 0;"></div>
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 600; color: #fff;">${idp.attribute_name}</div>
          <div style="font-size: 11px; color: #9ca3af;">${getPriorityLabel(idp.priority)} Focus${isHistorical ? ' (Historical)' : ''}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #9ca3af;">${dateRange}</div>
        </div>
      </div>

      <!-- Training Summary -->
      <div style="display: flex; gap: 24px; margin-bottom: 12px;">
        <div>
          <div style="font-size: 20px; font-weight: 700; color: #fff;">${idp.training_sessions}</div>
          <div style="font-size: 10px; color: #6b7280;">Training Sessions</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: 700; color: #fff;">${idp.last_trained_date ? formatDateShort(idp.last_trained_date) : '-'}</div>
          <div style="font-size: 10px; color: #6b7280;">Last Trained</div>
        </div>
      </div>

      <!-- Session List -->
      ${
        idp.sessions.length > 0
          ? `
        <div style="background: #1f1f1f; border-radius: 6px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 600; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Training History</div>
          <div style="display: grid; gap: 6px;">
            ${idp.sessions
              .slice(0, 10)
              .map(
                (session) => `
              <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: #2a2a2a; border-radius: 4px;">
                <div style="font-size: 11px; color: #6b7280; min-width: 60px;">${formatDateShort(session.session_date)}</div>
                <div style="font-size: 11px; color: #d1d5db; flex: 1;">${session.session_title}</div>
              </div>
            `
              )
              .join('')}
            ${idp.sessions.length > 10 ? `<div style="font-size: 11px; color: #6b7280; text-align: center; padding: 4px;">+ ${idp.sessions.length - 10} more sessions</div>` : ''}
          </div>
        </div>
      `
          : `
        <div style="background: #1f1f1f; border-radius: 6px; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
          No training sessions recorded
        </div>
      `
      }
    </div>
  `
}

/**
 * Generate training balance summary stats
 */
function generateBalanceStats(balance: PlayerTrainingBalance[]): string {
  if (!balance || balance.length === 0) return ''

  const totalOpportunities = balance.reduce((sum, b) => sum + b.total_opportunities, 0)

  return `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px;">
      ${CATEGORY_ORDER.map((categoryKey) => {
        const category = balance.find((b) => b.category === categoryKey)
        const config = CATEGORY_CONFIG[categoryKey]
        const value = category?.total_opportunities || 0
        const percentage = totalOpportunities > 0 ? (value / totalOpportunities) * 100 : 0

        return `
          <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #1f1f1f; border-radius: 6px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${config?.color}; flex-shrink: 0;"></div>
            <div style="flex: 1;">
              <div style="font-size: 11px; font-weight: 500; color: #fff;">${config?.label}</div>
              <div style="font-size: 10px; color: #6b7280;">${Math.round(value)} opportunities (${Math.round(percentage)}%)</div>
            </div>
          </div>
        `
      }).join('')}
    </div>
  `
}

/**
 * Generate the complete HTML report
 */
export function generatePlayerReportHTML(data: PlayerReportData): string {
  const { player, club, team, attendanceSummary, activeIdps, historicalIdps, trainingBalance, generatedAt } = data

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Player Development Report - ${player.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #111;
      color: #fff;
      line-height: 1.5;
      padding: 40px;
    }

    @page {
      size: A4;
      margin: 20mm;
    }

    @media print {
      body {
        padding: 0;
        background: #111;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page-break {
        page-break-before: always;
      }
    }

    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #374151;
    }

    .club-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .club-logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #efbf04 0%, #b8960a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: #111;
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
    }

    .report-title {
      font-size: 12px;
      color: #efbf04;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .player-name {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .player-details {
      font-size: 14px;
      color: #9ca3af;
    }

    .header-meta {
      text-align: right;
    }

    .club-name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .team-name {
      font-size: 12px;
      color: #9ca3af;
    }

    .generated-date {
      font-size: 10px;
      color: #6b7280;
      margin-top: 8px;
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #efbf04;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #374151;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #1a1a1a;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 16px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }

    .stat-label {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }

    .balance-container {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .balance-chart {
      flex-shrink: 0;
    }

    .balance-stats {
      flex: 1;
    }

    .idp-section {
      background: #1a1a1a;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .empty-state {
      background: #1a1a1a;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      color: #6b7280;
    }

    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #374151;
      text-align: center;
      color: #6b7280;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${
      club.logo_url
        ? `<img src="${club.logo_url}" alt="${club.name}" class="club-logo" />`
        : `<div class="club-logo-placeholder">${club.name.substring(0, 2).toUpperCase()}</div>`
    }
    <div class="header-info">
      <div class="report-title">Player Development Report</div>
      <div class="player-name">${player.name}</div>
      <div class="player-details">
        ${[player.position, player.age ? `${player.age} years old` : null, player.gender].filter(Boolean).join(' | ') || 'No details available'}
      </div>
    </div>
    <div class="header-meta">
      <div class="club-name">${club.name}</div>
      <div class="team-name">${team.name}</div>
      <div class="generated-date">Generated ${formatDate(generatedAt)}</div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="section">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${attendanceSummary.sessions_attended}</div>
        <div class="stat-label">Sessions Attended</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round(attendanceSummary.attendance_percentage)}%</div>
        <div class="stat-label">Attendance Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${activeIdps.length}</div>
        <div class="stat-label">Active IDPs</div>
      </div>
    </div>
  </div>

  <!-- Training Balance -->
  <div class="section">
    <div class="section-title">Training Balance</div>
    <div class="idp-section">
      <div class="balance-container">
        <div class="balance-chart">
          ${generateRadarChartSVG(trainingBalance)}
        </div>
        <div class="balance-stats">
          <div style="font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
            Distribution across the four main attribute categories
          </div>
          ${generateBalanceStats(trainingBalance)}
        </div>
      </div>
    </div>
  </div>

  <!-- Active IDPs -->
  <div class="section page-break">
    <div class="section-title">Active Development Goals (${activeIdps.length})</div>
    ${
      activeIdps.length > 0
        ? `<div class="idp-section">${activeIdps.map((idp) => generateIDPSection(idp, false)).join('')}</div>`
        : `<div class="empty-state">No active individual development plans assigned</div>`
    }
  </div>

  <!-- Historical IDPs -->
  ${
    historicalIdps.length > 0
      ? `
    <div class="section page-break">
      <div class="section-title">Historical Development Goals (${historicalIdps.length})</div>
      <div class="idp-section">
        ${historicalIdps.map((idp) => generateIDPSection(idp, true)).join('')}
      </div>
    </div>
  `
      : ''
  }

  <!-- Footer -->
  <div class="footer">
    Generated by Via Session Planner | ${formatDate(generatedAt)}
  </div>
</body>
</html>
  `
}
