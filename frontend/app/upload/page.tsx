'use client';
import FileDropzone from "@/components/FileDropzone";
import Link from "next/link";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Upload Log Files</h1>
          <p className="text-gray-700 mt-2">
            Upload your log files for processing and analysis
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <FileDropzone />
        </div>
      </div>
    </div>
  );
}
