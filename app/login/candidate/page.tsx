"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, ArrowRight, Briefcase, Loader2 } from "lucide-react"

export default function CandidateLoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async () => {
    setLoading(true)
    // Simulate OTP sending
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setOtpSent(true)
    setLoading(false)
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoading(false)
    router.push("/candidate/profile")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Login to your candidate account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
              <Tabs defaultValue="email" onValueChange={(v) => setLoginMethod(v as "email" | "phone")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-2">
                    <Phone className="h-4 w-4" />
                    Phone/WhatsApp
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="mt-6 space-y-4">
                  <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                    {error && (
                      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={loading || !email.trim() || !password}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Sign in
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  <p className="text-center text-xs text-muted-foreground">
                    Registered via an agency? Use the email you signed up with. If you don’t have a password yet,
                    contact your agency or use the link below to set one.
                  </p>
                </TabsContent>

                <TabsContent value="phone" className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {otpSent && loginMethod === "phone" && (
                    <div className="space-y-2">
                      <Label htmlFor="phone-otp">Enter OTP</Label>
                      <Input
                        id="phone-otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        OTP sent via WhatsApp to {phone}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-4">
                {loginMethod === "phone" && (
                  <>
                    {!otpSent ? (
                      <Button
                        className="w-full gap-2"
                        onClick={handleSendOtp}
                        disabled={loading || !phone}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Send OTP
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length !== 6}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Verify & Login
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                    {otpSent && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setOtpSent(false)
                          setOtp("")
                        }}
                      >
                        Change Phone
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {"Don't have an account? "}
                <Link href="/register/candidate" className="font-medium text-primary hover:underline">
                  Create Profile
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
