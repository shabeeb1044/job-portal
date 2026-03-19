import { NextResponse } from "next/server"

import fs from "fs"
import path from "path"

export const runtime = "nodejs"

function findCountryFolder(dataDir: string, countryCode: string) {
  const entries = fs.readdirSync(dataDir, { withFileTypes: true })
  const folder = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .find((name) => name.toUpperCase().endsWith(`-${countryCode}`))
  return folder || null
}

function findStateFolder(countryFolderPath: string, stateCode: string) {
  const entries = fs.readdirSync(countryFolderPath, { withFileTypes: true })
  const folder = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .find((name) => name.toUpperCase().endsWith(`-${stateCode}`))
  return folder || null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country")
    const state = searchParams.get("state")
    if (!country || !state) {
      return NextResponse.json({ error: "Missing country or state" }, { status: 400 })
    }

    const countryCode = country.toUpperCase()
    const stateCode = state.toUpperCase()

    const baseDir = path.join(process.cwd(), "node_modules", "@countrystatecity", "countries", "dist", "data")
    const countryFolder = findCountryFolder(baseDir, countryCode)
    if (!countryFolder) return NextResponse.json({ cities: [] })

    const countryFolderPath = path.join(baseDir, countryFolder)
    const stateFolder = findStateFolder(countryFolderPath, stateCode)
    if (!stateFolder) return NextResponse.json({ cities: [] })

    const citiesPath = path.join(countryFolderPath, stateFolder, "cities.json")
    const raw = fs.readFileSync(citiesPath, "utf-8")
    const cities = JSON.parse(raw) as any[]

    return NextResponse.json({
      cities: (cities || []).map((c) => ({
        name: c.name,
      })),
    })
  } catch (error) {
    console.error("Geo cities fetch error:", error)
    return NextResponse.json({ error: "Failed to load cities" }, { status: 500 })
  }
}

