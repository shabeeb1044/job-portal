import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [videoRequiredSetting, commissionRateSetting] = await Promise.all([
      db.settings.get('videoRequired'),
      db.settings.get('commissionRate'),
    ])
    const videoRequired = videoRequiredSetting?.value === true
    const commissionRate = typeof commissionRateSetting?.value === 'number'
      ? commissionRateSetting.value
      : 0.15
    return NextResponse.json({
      success: true,
      settings: { videoRequired, commissionRate },
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoRequired, commissionRate } = body

    if (videoRequired !== undefined) {
      await db.settings.set('videoRequired', !!videoRequired)
    }
    if (commissionRate !== undefined) {
      const rate = Number(commissionRate)
      if (rate < 0 || rate > 1) {
        return NextResponse.json(
          { error: 'Commission rate must be between 0 and 1 (e.g. 0.15 for 15%)' },
          { status: 400 }
        )
      }
      await db.settings.set('commissionRate', rate)
    }

    const [videoRequiredSetting, commissionRateSetting] = await Promise.all([
      db.settings.get('videoRequired'),
      db.settings.get('commissionRate'),
    ])
    return NextResponse.json({
      success: true,
      settings: {
        videoRequired: videoRequiredSetting?.value === true,
        commissionRate: typeof commissionRateSetting?.value === 'number'
          ? commissionRateSetting.value
          : 0.15,
      },
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
