import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Log Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            Analyze your log files with AI. Find problems, get answers, and understand what happened.
          </p>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Simply upload your log files and let AI help you understand them
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Link href="/upload" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📤</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                Upload Logs
              </h2>
              <p className="text-gray-600">
                Drag and drop your log files to get started
              </p>
            </div>
          </Link>

          <Link href="/search" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                Search
              </h2>
              <p className="text-gray-600">
                Find what you're looking for using simple words
              </p>
            </div>
          </Link>

          <Link href="/chat" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                Ask Questions
              </h2>
              <p className="text-gray-600">
                Ask questions in plain English and get instant answers
              </p>
            </div>
          </Link>

          <Link href="/dashboard" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                Dashboard
              </h2>
              <p className="text-gray-600">
                See all errors, warnings, and events at a glance
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-3xl mb-2">1️⃣</div>
                <h4 className="font-semibold text-gray-900 mb-2">Upload</h4>
                <p className="text-gray-600 text-sm">
                  Upload your log files. We'll automatically read and organize them.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">2️⃣</div>
                <h4 className="font-semibold text-gray-900 mb-2">Analyze</h4>
                <p className="text-gray-600 text-sm">
                  Our AI analyzes your logs to find problems and patterns.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">3️⃣</div>
                <h4 className="font-semibold text-gray-900 mb-2">Get Answers</h4>
                <p className="text-gray-600 text-sm">
                  Search, ask questions, or view summaries to understand what happened.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
