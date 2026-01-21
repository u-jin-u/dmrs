import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          Digital Marketing Reporting System
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Automated reporting from Meta Ads, Google Analytics, and Equals 5
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-foreground/20 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-left">
          <div className="p-4">
            <h3 className="font-semibold mb-2">Meta Ads</h3>
            <p className="text-sm text-muted-foreground">
              Automatically pull spend, impressions, clicks, and CTR data
            </p>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Google Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Fetch sessions, users, conversions, and traffic sources
            </p>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Equals 5</h3>
            <p className="text-sm text-muted-foreground">
              Browser automation extracts data from the platform
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
