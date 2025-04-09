'use client';

import { useEffect, useState, use } from 'react';
import { toast } from 'react-hot-toast';

type Product = {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  attributes: Record<string, string | null>;
};

type Attribute = {
  id: string;
  name: string;
  type: string;
  unit?: string;
  options?: string[];
};

export default function ProductListPage({ params }: { params: Promise<{ uploadId: string }> }) {
  const { uploadId } = use(params);
  const [products, setProducts] = useState<Product[]>([]);
  const [attributeKeys, setAttributeKeys] = useState<string[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<Record<string, string[]>>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingAttributes, setEditingAttributes] = useState<Record<string, string | null>>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showCreateAttrModal, setShowCreateAttrModal] = useState(false);
  const [newAttr, setNewAttr] = useState<{
    name: string;
    type: string;
    unit?: string;
    options?: string;
  }>({
    name: '',
    type: '',
    unit: '',
    options: '',
  });
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const limit = 5;

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleAttribute = (id: string) => {
    setSelectedAttributeIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const fetchAttributes = async () => {
    const res = await fetch('/api/attributes');
    const result = await res.json();
    setAttributes(result.data);
    setLoading(false);
  };

  const handleAddAttribute = async () => {
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
  };

  const fetchProducts = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      search,
      page: String(page),
      limit: String(limit),
      ...filters,
    }).toString();
    const res = await fetch(`/api/uploads/${uploadId}/products?${queryParams}`);
    const response = await res.json();
    const items = response.data.items;
    setProducts(items);
    setTotalPages(Math.ceil(response.data.total / limit));
    setLoading(false);

    const keys = new Set<string>();
    const options: Record<string, Set<string>> = {};
    // @ts-ignore
    items.forEach(p => {
      Object.entries(p.attributes || {}).forEach(([key, value]) => {
        keys.add(key.trim().toLowerCase());
        if (!options[key]) options[key] = new Set();
        // @ts-ignore
        if (value) options[key].add(value);
      });
    });

    const attributeKeyList = Array.from(keys);
    setAttributeKeys(attributeKeyList);
    const parsedOptions: Record<string, string[]> = {};
    for (const k of attributeKeyList) {
      parsedOptions[k] = Array.from(options[k]).sort();
    }
    setAttributeOptions(parsedOptions);
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, page, debouncedSearch]);

  useEffect(() => {
    fetchAttributes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEnrich = async () => {
    setEnriching(true);
    await fetch(`/api/uploads/${uploadId}/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: selectedProductIds }),
    });
    await fetchProducts();
    setSelectedProductIds([]);
    setEnriching(false);
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    await fetch(`/api/attributes/${id}`, {
      method: 'DELETE',
    });

    setAttributes(prev => prev.filter(attr => attr.id !== id));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditingAttributes({ ...product.attributes });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditingAttributes({});
  };

  const handleAttributeEditChange = (key: string, value: string) => {
    setEditingAttributes(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    await fetch(`/api/uploads/${editingProduct.id}/products`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributes: editingAttributes }),
    });
    closeEditModal();
    fetchProducts();
  };

  const handleSaveAttributesToUpload = async () => {
    if (selectedAttributeIds.length === 0) {
      toast.error('Please select at least one attribute.');
      return;
    }

    try {
      const res = await fetch(`/api/uploads/${uploadId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributeIds: selectedAttributeIds }),
      });

      if (!res.ok) {
        throw new Error('Failed to assign attributes to upload.');
      }

      toast.success('Attributes assigned successfully!');
      setShowCreateAttrModal(false);
      fetchProducts(); // refresh product list if needed
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Product List</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, brand, or barcode..."
            className="w-full sm:w-96 px-4 py-2 rounded bg-gray-800 border border-gray-600 placeholder-gray-400 text-white"
          />

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowCreateAttrModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white cursor-pointer"
            >
              + Add Attribute
            </button>
            <button
              onClick={() => setShowFilterModal(true)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white cursor-pointer"
            >
              Filter
            </button>
            <button
              onClick={handleEnrich}
              disabled={enriching || selectedProductIds.length === 0}
              className={`px-4 py-2 rounded text-white 
 ${
   enriching || selectedProductIds.length === 0
     ? 'bg-green-600 opacity-50 cursor-not-allowed'
     : 'bg-green-600 hover:bg-green-700 cursor-pointer'
 }
 `}
            >
              {enriching ? 'Enriching...' : 'Enrich'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-md shadow">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-900 text-white sticky top-0">
                <tr>
                  <th className="p-2 border">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedProductIds.length === products.length}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Brand</th>
                  <th className="p-2 border">Barcode</th>
                  {attributeKeys.map(attr => (
                    <th key={attr} className="p-2 border capitalize">
                      {attr}
                    </th>
                  ))}
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id} className="even:bg-gray-800">
                    <td className="p-2 border">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(prod.id)}
                        onChange={() => toggleProductSelection(prod.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="p-2 border">{prod.name}</td>
                    <td className="p-2 border">{prod.brand}</td>
                    <td className="p-2 border">{prod.barcode}</td>
                    {attributeKeys.map(attr => (
                      <td key={attr} className="p-2 border text-gray-200">
                        {prod.attributes?.[attr] || <span className="text-gray-500 italic">-</span>}
                      </td>
                    ))}
                    <td className="p-2 border">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="text-blue-400 hover:underline text-xs cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={closeEditModal}
            className="absolute inset-0 bg-black bg-opacity-70 animate-fadeIn"
          />
          <div className="relative bg-[#111827] text-white dark:text-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
            <h2 className="text-lg font-bold mb-4">Edit Attributes</h2>
            {attributeKeys.map(attr => (
              <div key={attr} className="mb-4">
                <label className="block mb-1 capitalize">{attr}</label>
                <input
                  type="text"
                  value={editingAttributes[attr] || ''}
                  onChange={e => handleAttributeEditChange(attr, e.target.value)}
                  className="w-full p-2 rounded border bg-white text-black dark:bg-gray-800 dark:text-white"
                />
              </div>
            ))}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded border dark:border-gray-600 text-gray-700 dark:text-white dark:hover:bg-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setShowFilterModal(false)}
            className="absolute inset-0 bg-black bg-opacity-70 animate-fadeIn"
          />
          <div className="relative bg-[#111827] text-white dark:text-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
            <h2 className="text-lg font-bold mb-4">Filter Productss</h2>
            {attributeKeys.map(attr => (
              <div key={attr} className="mb-4">
                <label className="block mb-1 capitalize">{attr}</label>
                <select
                  value={filters[attr] || ''}
                  onChange={e => handleFilterChange(attr, e.target.value)}
                  className="w-full p-2 rounded border bg-white text-black dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All</option>
                  {attributeOptions[attr]?.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  clearFilters();
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Attribute Modal */}
      {showCreateAttrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setShowCreateAttrModal(false)}
            className="absolute inset-0 bg-black bg-opacity-70 animate-fadeIn"
          />
          <div className="relative bg-[#111827] text-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
            <h2 className="text-xl font-bold mb-6 text-center">Manage Attributes</h2>

            {/* List Attributes */}
            <div className="space-y-3 mb-8">
              {attributes.map(attr => (
                <div
                  key={attr.id}
                  className="flex items-center justify-between bg-gray-800 p-3 rounded hover:bg-gray-700 transition u"
                >
                  <label className="flex items-center gap-3 w-full">
                    <input
                      type="checkbox"
                      checked={selectedAttributeIds.includes(attr.id)}
                      onChange={() => toggleAttribute(attr.id)}
                      className="accent-blue-500 w-5 h-5 cursor-pointer"
                    />
                    <span className="capitalize flex-1">{attr.name}</span>
                  </label>
                  <button
                    onClick={() => handleDelete(attr.id)}
                    className="text-red-400 hover:text-red-600 text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* Add Attribute Section */}
            <div className="bg-gray-900 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-white">Add New Attribute</h3>
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
                    className="bg-gray-800 border border-gray-600 px-3 py-2 rounded text-white col-span-2"
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
              <div className="text-right">
                <button
                  onClick={handleAddAttribute}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Add Attribute
                </button>
              </div>
            </div>

            {/* Close Modal Button */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleSaveAttributesToUpload}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setShowCreateAttrModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
