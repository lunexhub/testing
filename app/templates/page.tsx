'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  body: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY',
    bodyText: '',
    footer: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowCreateForm(false);
        setFormData({ name: '', category: 'UTILITY', bodyText: '', footer: '' });
        fetchTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const deleteTemplate = async (name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;

    try {
      const response = await fetch(`/api/templates/${name}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              WhatsApp Templates
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your approved WhatsApp message templates
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            {showCreateForm ? 'Cancel' : '+ Create Template'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Template</h2>
            <form onSubmit={createTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="appointment_reminder"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase, underscores only (e.g., booking_confirmation)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="UTILITY">Utility (Transactional)</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Authentication (OTP)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body *
                </label>
                <textarea
                  value={formData.bodyText}
                  onChange={(e) =>
                    setFormData({ ...formData, bodyText: e.target.value })
                  }
                  placeholder="Hi {{1}}! Your appointment for {{2}} is confirmed for {{3}}."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{1}}`}, {`{{2}}`}, etc. for dynamic variables
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer (Optional)
                </label>
                <input
                  type="text"
                  value={formData.footer}
                  onChange={(e) =>
                    setFormData({ ...formData, footer: e.target.value })
                  }
                  placeholder="Reply CANCEL to cancel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ⏱️ <strong>Note:</strong> Templates must be approved by Meta
                  before use. This usually takes 24-48 hours.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {creating ? 'Creating...' : 'Create & Submit for Approval'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Your Templates</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No templates yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-green-600 hover:underline"
              >
                Create your first template
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div key={template.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{template.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            template.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : template.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {template.status}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-2">
                        {template.body}
                      </p>
                      <p className="text-xs text-gray-500">
                        Language: {template.language} • Created:{' '}
                        {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTemplate(template.name)}
                      className="ml-4 text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 Template Tips</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Use variables ({`{{1}}`}, {`{{2}}`}) for dynamic content</li>
            <li>Keep messages clear and concise</li>
            <li>UTILITY templates are approved faster than MARKETING</li>
            <li>Include opt-out instructions for marketing messages</li>
            <li>Test templates thoroughly before sending to customers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
