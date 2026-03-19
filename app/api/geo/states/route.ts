import { NextResponse } from "next/server"

import fs from "fs"
import path from "path"

export const runtime = "nodejs"

function findCountryFolder(dataDir: string, countryCode: string) {
  // Folder format: SomethingLike_United_States-US (ends with -{ISO2})
  const entries = fs.readdirSync(dataDir, { withFileTypes: true })
  const folder = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .find((name) => name.toUpperCase().endsWith(`-${countryCode}`))
  return folder || null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country")
    if (!country) {
      return NextResponse.json({ error: "Missing country" }, { status: 400 })
    }

    const countryCode = country.toUpperCase()
    const baseDir = path.join(process.cwd(), "node_modules", "@countrystatecity", "countries", "dist", "data")
    const countryFolder = findCountryFolder(baseDir, countryCode)
    if (!countryFolder) return NextResponse.json({ states: [] })

    const statesPath = path.join(baseDir, countryFolder, "states.json")
    const raw = fs.readFileSync(statesPath, "utf-8")
    const states = JSON.parse(raw) as any[]

    return NextResponse.json({
      states: (states || []).map((s) => ({
        iso2: s.iso2,
        name: s.name,
      })),
    })
  } catch (error) {
    console.error("Geo states fetch error:", error)
    return NextResponse.json({ error: "Failed to load states" }, { status: 500 })
  }
}

