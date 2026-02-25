"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, MapPin, Briefcase, ArrowRight, Play } from "lucide-react"

const jobCategories = [
  "All Categories",
  "Engineering",
  "Healthcare",
  "Construction",
  "Hospitality",
  "IT & Technology",
  "Manufacturing",
  "Logistics",
  "Finance",
]

const locations = [
  "All Locations",
  "Dubai, UAE",
  "Abu Dhabi, UAE",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
]

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")

  return (
    <section className="relative overflow-hidden bg-background pb-20 pt-12 md:pb-32 md:pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-accent" />
            <span className="text-muted-foreground">Revolutionizing Recruitment with Smart Bidding</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Find Your Perfect Match Through{" "}
            <span className="text-primary">Competitive Bidding</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Connect candidates, companies, and agencies on a transparent platform where talent meets opportunity through fair, competitive bidding.
          </p>

          {/* Search Box */}
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl border hidden  border-border bg-card p-3 shadow-lg md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
             
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Job title, skills, or keywords"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 border-0 bg-secondary pl-10 text-base focus-visible:ring-0"
                />
              </div>

              {/* Category Select */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 w-full border-0 bg-secondary md:w-44">
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {jobCategories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location Select */}
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-12 w-full border-0 bg-secondary md:w-44">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc.toLowerCase()}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search Button */}
              <Button size="lg" className="h-12 px-8">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {/* Popular Searches */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {["Nurse", "Engineer", "Driver", "Chef", "IT Support"].map((term) => (
                <button
                  key={term}
                  className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/register/candidate">
                Create Free Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 px-8 bg-transparent">
              <Link href="/how-it-works">
                <Play className="h-4 w-4" />
                Watch How It Works
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-border pt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Active Jobs</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">200K+</div>
              <div className="text-sm text-muted-foreground">Candidates</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">5K+</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Agencies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
