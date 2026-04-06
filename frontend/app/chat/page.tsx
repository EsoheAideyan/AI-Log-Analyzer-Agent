import { Suspense } from "react";
import AskChatBot from "@/components/AskChatBot";
import Link from "next/link";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ask Questions</h1>
          <p className="text-gray-900 mt-2">
            Get AI-powered answers about your logs using RAG
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Suspense
            fallback={
              <p className="text-gray-700 p-4">Loading chat…</p>
            }
          >
            <AskChatBot />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
