'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type Upload = {
  id: string;
  fileName: string;
  uploadedAt: string;
};

export default function UploadListPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUploads = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(debouncedSearch ? { fileName: debouncedSearch } : {}),
    }).toString();

    const res = await fetch(`/api/uploads?${query}`);
    const result = await res.json();

    setUploads(result.data.data || []);
    setTotalPages(result.data.totalPages || 1);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return;

    try {
      const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete upload');
        return;
      }

      toast.success('Upload deleted successfully');
      fetchUploads();
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while deleting');
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [page, debouncedSearch]);

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Upload History</h1>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by file name..."
          className="w-full sm:w-96 px-4 py-2 rounded bg-gray-800 border border-gray-600 placeholder-gray-400 text-white"
        />
      </div>

      {loading ? (
        <p className="text-gray-300">Loading uploads...</p>
      ) : uploads.length === 0 ? (
        <p className="text-gray-400 italic">No uploads found.</p>
      ) : (
        <>
          <div className="bg-gray-900 rounded-lg shadow overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800 text-gray-200">
                <tr>
                  <th className="px-4 py-3 border">Filename</th>
                  <th className="px-4 py-3 border">Uploaded At</th>
                  <th className="px-4 py-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map(upload => (
                  <tr key={upload.id} className="even:bg-gray-800">
                    <td className="px-4 py-3 border">{upload.fileName}</td>
                    <td className="px-4 py-3 border">
                      {new Date(upload.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 border">
                      <Link
                        href={`/upload/${upload.id}/products`}
                        className="text-blue-400 hover:underline text-sm"
                      >
                        Manage
                      </Link>
                      <button
                        onClick={() => handleDelete(upload.id)}
                        className="ml-4 text-red-400 hover:underline text-sm cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center items-center mt-6 space-x-4 text-sm">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className={`px-4 py-2 rounded border ${
                page === 1
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700 text-white cursor-pointer'
              }`}
            >
              Previous
            </button>

            <span className="text-white">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded border ${
                page === totalPages
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700 text-white cursor-pointer'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
