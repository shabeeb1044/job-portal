import { NextResponse } from "next/server"
import { getCountries } from "@countrystatecity/countries"

export const runtime = "nodejs"

export async function GET() {
  try {
    const countries = await getCountries()
    return NextResponse.json({
      countries: (countries || []).map((c: any) => ({
        iso2: c.iso2,
        name: c.name,
      })),
    })
  } catch (error) {
    console.error("Geo countries fetch error:", error)
    return NextResponse.json({ error: "Failed to load countries" }, { status: 500 })
  }
}

