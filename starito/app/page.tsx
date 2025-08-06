export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <main className="text-center max-w-md mx-auto px-4">
        <h1 className="font-heading text-4xl font-bold text-primary mb-4">
          <span className="sr-only">Starito - </span>
          🌟 Starito
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Gamified rewards system for kids to encourage positive behaviors
        </p>
        <div className="space-y-4">
          <a
            href="/login"
            className="btn-primary inline-block w-full text-center focus:outline-none focus:ring-4 focus:ring-primary/30 focus:ring-offset-2"
            role="button"
            aria-describedby="login-description"
          >
            Get Started
          </a>
          <p id="login-description" className="text-sm text-gray-600">
            Choose between child or parent login
          </p>
        </div>
      </main>
    </div>
  )
}