import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db, initializeDatabase } from "@/lib/db"

export const CANDIDATE_PROFILE_CALLBACK = "/candidate/profile"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: { prompt: "consent" },
      },
    }),
  ],
  pages: {
    signIn: "/login/candidate",
    error: "/login/candidate",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user?.email) return false
      try {
        await initializeDatabase()
        const existing = await db.candidates.getByEmail(user.email)
        if (existing) return true
        const nameParts = (user.name || user.email).split(" ")
        const firstName = nameParts[0] ?? ""
        const lastName = nameParts.slice(1).join(" ") ?? ""
        await db.candidates.create({
          role: "candidate",
          firstName,
          lastName,
          email: user.email,
          phone: "",
          password: "google_" + (user.id ?? "") + "_" + Date.now(),
          isActive: true,
          status: "available",
          dateOfBirth: "",
          gender: "",
          nationality: "",
          currentLocation: "",
          preferredLocations: [],
          languages: [],
          maritalStatus: "",
          totalExperience: "",
          expectedSalary: "",
          noticePeriod: "",
          industries: [],
          jobTypes: [],
          jobCategories: [],
          highestEducation: "",
          fieldOfStudy: "",
          skills: [],
          certifications: [],
        })
        return true
      } catch (e) {
        console.error("NextAuth signIn callback:", e)
        return false
      }
    },
    async jwt({ token, account, user }) {
      if (account?.provider === "google" && user?.email) {
        try {
          await initializeDatabase()
          const candidate = await db.candidates.getByEmail(user.email)
          if (candidate) {
            token.id = candidate.id
            token.role = "candidate"
            token.name = `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || candidate.email
            token.email = candidate.email
          }
        } catch (e) {
          console.error("NextAuth jwt callback:", e)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string
        (session.user as { id?: string; role?: string }).role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch {
        // ignore
      }
      return `${baseUrl}${CANDIDATE_PROFILE_CALLBACK}`
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
