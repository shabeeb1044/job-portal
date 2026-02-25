import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

const footerLinks = {
  forCandidates: [
    { name: "Find Jobs", href: "/jobs" },
    { name: "Create Profile", href: "/register/candidate" },
    { name: "Job Alerts", href: "/job-alerts" },
    { name: "Career Resources", href: "/resources" },
  ],
  forCompanies: [
    { name: "Post Jobs", href: "/register/company" },
    { name: "Bidding Platform", href: "/bidding" },
    { name: "Pricing", href: "/pricing" },
    { name: "Success Stories", href: "/success-stories" },
  ],
  forAgencies: [
    { name: "Partner With Us", href: "/register/agency" },
    { name: "Bulk Upload", href: "/agency/bulk-upload" },
    { name: "Agency Dashboard", href: "/agency/dashboard" },
    { name: "Commission Rates", href: "/agency/commission" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <img src="/main-logo.png" alt="TalentBid" className="h-9 w-auto" />
              {/* <span className="text-xl font-bold text-foreground">TalentBid</span> */}
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Revolutionary recruitment platform connecting talent with opportunities through smart bidding.
            </p>
            <div className="mt-6 space-y-2">
              <a
                href="mailto:support@talentbid.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                support@talentbid.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                +1 (234) 567-890
              </a>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Dubai, UAE
              </p>
            </div>
          </div>

          {/* For Candidates */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">For Candidates</h3>
            <ul className="space-y-2">
              {footerLinks.forCandidates.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Companies */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">For Companies</h3>
            <ul className="space-y-2">
              {footerLinks.forCompanies.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Agencies */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">For Agencies</h3>
            <ul className="space-y-2">
              {footerLinks.forAgencies.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TalentBid. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
