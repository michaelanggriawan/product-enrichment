'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Attribute = {
  id: string;
  name: string;
  type: string;
  unit?: string;
  options?: string[];
};

export default function AttributeSelectPage({ params }: { params: Promise<{ uploadId: string }> }) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAttr, setNewAttr] = useState<{
    name: string;
    type: string;
    unit?: string;
    options?: string;
  }>({ name: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [attrToDelete, setAttrToDelete] = useState<string | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingContinue, setLoadingContinue] = useState(false);
  const [loadingAddSave, setLoadingSave] = useState(false);
  const router = useRouter();
  const { uploadId } = use(params);

  const fetchAttributes = async () => {
    const res = await fetch('/api/attributes');
    const result = await res.json();
    setAttributes(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const toggleSelection = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
  };

  const handleAddAttribute = async () => {
    setLoadingSave(true);
    if (!newAttr.name || !newAttr.type) {
      alert('Please fill in name and type');
      return;
    }

    const body = {
      name: newAttr.name,
      type: newAttr.type,
      unit: newAttr.unit || null,
      options: ['single_select', 'multiple_select'].includes(newAttr.type)
        ? newAttr.options?.split(',').map(o => o.trim()) || []
        : null,
    };

    const res = await fetch('/api/attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const result = await res.json();
      alert(result.error || 'Failed to add attribute');
      return;
    }

    setNewAttr({ name: '', type: '', unit: '', options: '' });
    fetchAttributes();
    setLoadingSave(false);
  };

  const confirmDelete = (id: string) => {
    setAttrToDelete(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    setLoadingDelete(true);
    if (!attrToDelete) return;
    await fetch(`/api/attributes/${attrToDelete}`, {
      method: 'DELETE',
    });

    setAttributes(prev => prev.filter(attr => attr.id !== attrToDelete));
    setSelected(prev => prev.filter(s => s !== attrToDelete));
    toast.success('Attribute deleted!');
    setAttrToDelete(null);
    setShowModal(false);
    setLoadingDelete(false);
  };

  const handleContinue = async () => {
    setLoadingContinue(true);
    const res = await fetch(`/api/uploads/${uploadId}/attributes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributeIds: selected }),
    });

    if (!res.ok) {
      toast.error('Failed to save selected attributes!');
      return;
    }

    toast.success('Attributes saved!');

    router.push(`/upload/${uploadId}/products`);
    setLoadingContinue(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Select Attributes to Enrich</h1>

      {loading ? (
        <p className="text-gray-300 text-center">Loading attributes...</p>
      ) : (
        <div className="space-y-3 mb-8">
          {attributes.map(attr => (
            <div
              key={attr.id}
              className="flex items-center justify-between bg-gray-800 p-3 rounded hover:bg-gray-700 transition"
            >
              <label className="flex items-center space-x-3">
                <input
                  disabled={loadingDelete}
                  type="checkbox"
                  checked={selected.includes(attr.id)}
                  onChange={() => toggleSelection(attr.id)}
                  className="accent-blue-500 w-5 h-5"
                />
                <span className="capitalize">{attr.name}</span>
              </label>
              <button
                onClick={() => confirmDelete(attr.id)}
                className="text-red-400 hover:text-red-600 text-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 p-4 rounded-lg space-y-4 mb-10">
        <h2 className="text-xl font-semibold text-white">Add New Attribute</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Attribute name"
            value={newAttr.name}
            onChange={e => setNewAttr({ ...newAttr, name: e.target.value })}
            className="bg-gray-800 border border-gray-600 px-3 py-2 rounded text-white"
          />
          <select
            value={newAttr.type}
            onChange={e => setNewAttr({ ...newAttr, type: e.target.value })}
            className="bg-gray-800 border border-gray-600 px-3 py-2 rounded text-white"
          >
            <option value="">Select type</option>
            <option value="short_text">Short Text</option>
            <option value="long_text">Long Text</option>
            <option value="rich_text">Rich Text (HTML)</option>
            <option value="number">Number</option>
            <option value="single_select">Single Select</option>
            <option value="multiple_select">Multiple Select</option>
            <option value="measure">Measure (Unit + Value)</option>
          </select>

          {newAttr.type === 'measure' && (
            <input
              type="text"
              placeholder="Unit (e.g. USD, cm)"
              value={newAttr.unit}
              onChange={e => setNewAttr({ ...newAttr, unit: e.target.value })}
              className="bg-gray-800 border border-gray-600 px-3 py-2 rounded text-white"
            />
          )}

          {['single_select', 'multiple_select'].includes(newAttr.type) && (
            <input
              type="text"
              placeholder="Options (comma separated)"
              value={newAttr.options}
              onChange={e => setNewAttr({ ...newAttr, options: e.target.value })}
              className="bg-gray-800 border border-gray-600 px-3 py-2 rounded text-white col-span-2"
            />
          )}
        </div>
        <button
          disabled={loadingAddSave}
          onClick={handleAddAttribute}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer"
        >
          Add Attribute
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={handleContinue}
          disabled={selected.length === 0 || loadingContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 cursor-pointer"
        >
          Continue
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 w-full max-w-md shadow-lg bg-white text-black dark:bg-gray-800 dark:text-white">
            <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this attribute?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-400 text-gray-800 hover:bg-gray-200 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
