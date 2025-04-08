'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import Papa from 'papaparse';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[][]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const csv = e.target.files?.[0];
    if (!csv) return;
    setFile(csv);

    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const data = results.data as any[];
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => row[h]));
        setPreview([headers, ...rows]);
      },
    });
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Upload failed.');
        return;
      }

      const { uploadId, errors } = result.data;

      if (errors && errors.length > 0) {
        toast.error(`Upload finished with ${errors.length} issues. Check your file.`);
        console.warn('Upload validation errors:', errors);
      } else {
        toast.success('Upload successful!');
      }

      router.push(`/upload/${uploadId}/attributes`);
    } catch (err) {
      toast.error('Something went wrong while uploading.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Upload Products</h1>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-gray-800 text-white px-4 py-2 rounded mb-4 mr-10 cursor-pointer"
      >
        {file ? `Selected: ${file.name}` : 'Choose CSV file'}
      </button>

      {preview.length > 0 && (
        <div className="overflow-x-auto border rounded-md max-h-[400px] mb-6 shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                {preview[0].map((h, i) => (
                  <th key={i} className="px-4 py-2 border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {preview.slice(1).map((row, i) => (
                <tr key={i} className="hover:bg-blue-50">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-4 py-2 border text-gray-800 whitespace-pre-line break-words max-w-[300px]"
                    >
                      {cell || <span className="text-gray-400 italic">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 cursor-pointer"
      >
        {uploading ? 'Uploading...' : 'Continue'}
      </button>
    </div>
  );
}
