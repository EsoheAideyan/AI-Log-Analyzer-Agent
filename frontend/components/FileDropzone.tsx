import { useState } from 'react';
import { useDropzone } from "react-dropzone";
import Link from "next/link";


export default function FileDropzone() {
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [lastFileId, setLastFileId] = useState<string | null>(null);

    const onDrop = async (acceptedFiles: File[]) => {
        await handleUpload(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.log', '.txt'],
            'application/json': ['.json']
        }
    });

    async function handleUpload(acceptedFiles: File[]): Promise<void> {
        setUploading(true);
        setUploadStatus('Uploading...');
        
        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }
                
                const data = await response.json();
                if (data.file_id) {
                    setLastFileId(data.file_id);
                }
                setUploadStatus(`✓ ${file.name} uploaded successfully`);
                console.log('File uploaded successfully:', data);
            } catch (error) {
                setUploadStatus(`✗ Error uploading ${file.name}: ${error}`);
                console.error('Error uploading file:', error);
            }
        }
        
        setUploading(false);
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">File Dropzone</h1>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
            >
                <input {...getInputProps()} />
                <p className={`text-base font-medium ${
                    isDragActive ? 'text-blue-700' : 'text-gray-700'
                }`}>
                    {isDragActive
                        ? 'Drop the files here...'
                        : 'Drag and drop log files here, or click to select files'}
                </p>
            </div>
            {uploadStatus && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                    uploadStatus.startsWith('✓') 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                    <p className="font-semibold text-base mb-3">{uploadStatus}</p>
                    {uploadStatus.startsWith('✓') && (
                        <div className="mt-4 pt-4 border-t border-green-300">
                            <p className="text-sm font-medium text-green-900 mb-3">
                                What would you like to do next?
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link 
                                    href={lastFileId ? `/search?file_id=${encodeURIComponent(lastFileId)}` : '/search'}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    🔍 Search Logs
                                </Link>
                                <Link 
                                    href={lastFileId ? `/chat?file_id=${encodeURIComponent(lastFileId)}` : '/chat'}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    💬 Ask Questions
                                </Link>
                                <Link 
                                    href="/dashboard" 
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    📊 View Dashboard
                                </Link>
                                <Link 
                                    href="/" 
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                                >
                                    🏠 Back to Home
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {uploading && (
                <p className="mt-2 text-blue-700 font-medium">Processing...</p>
            )}
        </div>
    );
}
