export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full border-2 border-primary/30 loading-pulse-ring" />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 7h-9" />
              <path d="M14 17H5" />
              <circle cx="17" cy="17" r="3" />
              <circle cx="7" cy="7" r="3" />
            </svg>
          </div>
        </div>
        <div className="text-center loading-fade-up">
          <img src="/main-logo.png" alt="TalentBid" className="mx-auto h-10 w-auto" />
          {/* <p className="mt-2 text-base font-semibold text-foreground">TalentBid</p> */}
          {/* <p className="text-xs text-muted-foreground mt-1">Loading...</p> */}
        </div>

        {/* Progress bar */}
        <div className="w-48 loading-fade-up loading-fade-up-delay-1">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-primary loading-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
