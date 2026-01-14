import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Log Analyzer Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Intelligent log analysis using RAG (Retrieval-Augmented Generation) 
            to search, summarize, and detect anomalies in SCADA/field logs
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
                Upload and process your log files for analysis
              </p>
            </div>
          </Link>

          <Link href="/search" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                Semantic Search
              </h2>
              <p className="text-gray-600">
                Search logs using natural language queries
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
                Get AI-powered answers about your logs
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
                View anomalies and timeline visualizations
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            Powered by FastAPI, Next.js, FAISS, and OpenAI
          </p>
        </div>
      </div>
    </div>
  );
}
