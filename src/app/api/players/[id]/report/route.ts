import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { getPlayerReportData } from '@/lib/playerReportData'
import { generatePlayerReportHTML } from '@/lib/playerReportTemplate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for PDF generation

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Fetch all report data
    const { data, error } = await getPlayerReportData(playerId, teamId)

    if (error || !data) {
      return NextResponse.json({ error: error || 'Failed to fetch report data' }, { status: 500 })
    }

    // Generate HTML
    const html = generatePlayerReportHTML(data)

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()

    // Set content with wait until networkidle0 to ensure images load
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    })

    await browser.close()

    // Create filename from player name
    const filename = `${data.player.name.replace(/[^a-zA-Z0-9]/g, '-')}-report.pdf`

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generating player report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
