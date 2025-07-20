export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-primary mb-4">
          🌟 Starito
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Gamified rewards for kids
        </p>
        <div className="space-y-4">
          <a
            href="/login"
            className="block w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  )
}