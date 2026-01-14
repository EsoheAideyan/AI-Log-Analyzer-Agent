import { useState } from 'react';
import { useDropzone } from "react-dropzone";


export default function FileDropzone() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    const onDrop = async (acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
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
                setUploadStatus(`✓ ${file.name} uploaded successfully (${data.events_count} events)`);
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
            <h1 className="text-2xl font-bold mb-4">File Dropzone</h1>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
            >
                <input {...getInputProps()} />
                <p className="text-gray-600">
                    {isDragActive
                        ? 'Drop the files here...'
                        : 'Drag and drop log files here, or click to select files'}
                </p>
            </div>
            {uploadStatus && (
                <div className={`mt-4 p-2 rounded ${uploadStatus.startsWith('✓') ? 'bg-green-100' : 'bg-red-100'}`}>
                    {uploadStatus}
                </div>
            )}
            {uploading && <p className="mt-2 text-blue-600">Processing...</p>}
        </div>
    );
}