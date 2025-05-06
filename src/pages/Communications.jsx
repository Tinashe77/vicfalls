// src/pages/Communications.jsx
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  CalendarIcon,
  StarIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';

export default function Communications() {
  const [view, setView] = useState('templates'); // 'templates' or 'announcements'
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'pre-race',
  });
  const [sendEmailForm, setSendEmailForm] = useState({
    templateId: '',
    subject: '',
    categories: []
  });
  const [sendAnnouncementForm, setSendAnnouncementForm] = useState({
    title: '',
    message: '',
    categories: [],
    scheduleDate: ''
  });
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  useEffect(() => {
    if (view === 'templates') {
      fetchTemplates();
    }
  }, [view]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/communications/templates');
      
      if (response.data?.success) {
        const fetchedTemplates = response.data.data || [];
        setTemplates(fetchedTemplates);
        
        // Select first template if none is selected
        if (fetchedTemplates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(fetchedTemplates[0]);
        }
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch email templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch email templates');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setCurrentTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category
      });
    } else {
      setCurrentTemplate(null);
      setFormData({
        name: '',
        subject: '',
        content: '',
        category: 'pre-race'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTemplate(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      let response;
      if (currentTemplate) {
        // Update existing template
        response = await axios.put(`/communications/templates/${currentTemplate._id}`, formData);
      } else {
        // Create new template
        response = await axios.post('/communications/templates', formData);
      }
      
      if (response.data?.success) {
        // Refresh templates to get updated list
        await fetchTemplates();
        
        // Set selected template to the one we just created/updated
        if (response.data.data) {
          setSelectedTemplate(response.data.data);
        }
        
        closeModal();
      } else {
        throw new Error(response.data?.message || 'Failed to save template');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save email template');
    } finally {
      setLoading(false);
    }
  };

  const extractVariables = (content) => {
    // Simple regex to extract variables like {{variable}}
    const regex = /{{([^}]+)}}/g;
    const matches = content.match(regex) || [];
    return [...new Set(matches.map(match => match.slice(2, -2).trim()))];
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await axios.delete(`/communications/templates/${templateId}`);
      
      if (response.data?.success) {
        // Remove from the templates array
        const updatedTemplates = templates.filter(template => template._id !== templateId);
        setTemplates(updatedTemplates);
        
        // If the deleted template was selected, select another one
        if (selectedTemplate && selectedTemplate._id === templateId) {
          setSelectedTemplate(updatedTemplates.length > 0 ? updatedTemplates[0] : null);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete template');
    }
  };

  const openSendModal = () => {
    if (templates.length === 0) {
      alert('No templates available. Please create a template first.');
      return;
    }
    
    setSendEmailForm({
      templateId: templates[0]._id,
      subject: templates[0].subject,
      categories: []
    });
    
    setIsSendModalOpen(true);
  };

  const closeSendModal = () => {
    setIsSendModalOpen(false);
  };

  const handleSendEmailFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'templateId') {
      const selectedTemplate = templates.find(template => template._id === value);
      setSendEmailForm({
        ...sendEmailForm,
        templateId: value,
        subject: selectedTemplate ? selectedTemplate.subject : ''
      });
    } else if (type === 'checkbox') {
      const categories = [...sendEmailForm.categories];
      if (checked) {
        categories.push(value);
      } else {
        const index = categories.indexOf(value);
        if (index !== -1) {
          categories.splice(index, 1);
        }
      }
      setSendEmailForm({
        ...sendEmailForm,
        categories
      });
    } else {
      setSendEmailForm({
        ...sendEmailForm,
        [name]: value
      });
    }
  };

  const handleSendAnnouncementFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const categories = [...sendAnnouncementForm.categories];
      if (checked) {
        categories.push(value);
      } else {
        const index = categories.indexOf(value);
        if (index !== -1) {
          categories.splice(index, 1);
        }
      }
      setSendAnnouncementForm({
        ...sendAnnouncementForm,
        categories
      });
    } else {
      setSendAnnouncementForm({
        ...sendAnnouncementForm,
        [name]: value
      });
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    
    if (sendEmailForm.categories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    
    try {
      setIsSendingEmail(true);
      
      const response = await axios.post('/communications/email', sendEmailForm);
      
      if (response.data?.success) {
        alert('Email notification queued successfully!');
        closeSendModal();
      } else {
        throw new Error(response.data?.message || 'Failed to send email notification');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send email notification');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    
    if (sendAnnouncementForm.categories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    
    try {
      setIsSendingAnnouncement(true);
      
      const response = await axios.post('/communications/announce', sendAnnouncementForm);
      
      if (response.data?.success) {
        alert('Announcement sent successfully!');
        setSendAnnouncementForm({
          title: '',
          message: '',
          categories: [],
          scheduleDate: ''
        });
      } else {
        throw new Error(response.data?.message || 'Failed to send announcement');
      }
    } catch (err) {
      console.error('Error sending announcement:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send announcement');
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'pre-race':
        return 'bg-blue-100 text-blue-800';
      case 'race-day':
        return 'bg-green-100 text-green-800';
      case 'post-race':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Template Modal
  const TemplateModal = () => (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {currentTemplate ? 'Edit Email Template' : 'Create New Email Template'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Template Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        name="category"
                        id="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="pre-race">Pre-Race</option>
                        <option value="race-day">Race Day</option>
                        <option value="post-race">Post-Race</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        Email Content (HTML)
                      </label>
                      <div className="mt-1 text-xs text-gray-500">
                        Available variables: {'{{'} runner.name {'}}'},  {'{{'} runner.number {'}}'},  {'{{'} race.name {'}}'},  {'{{'} race.date {'}}'}
                      </div>
                      <textarea
                        name="content"
                        id="content"
                        rows="10"
                        value={formData.content}
                        onChange={handleInputChange}
                        required
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {currentTemplate ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Send Email Modal
  const SendEmailModal = () => (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeSendModal}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={sendEmail}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Send Email Notification
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
                        Email Template
                      </label>
                      <select
                        name="templateId"
                        id="templateId"
                        value={sendEmailForm.templateId}
                        onChange={handleSendEmailFormChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        {templates.map(template => (
                          <option key={template._id} value={template._id}>{template.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        value={sendEmailForm.subject}
                        onChange={handleSendEmailFormChange}
                        required
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Send to Categories
                      </label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            id="category-half"
                            name="categories"
                            type="checkbox"
                            value="Half Marathon"
                            checked={sendEmailForm.categories.includes('Half Marathon')}
                            onChange={handleSendEmailFormChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="category-half" className="ml-2 block text-sm text-gray-900">
                            Half Marathon
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="category-full"
                            name="categories"
                            type="checkbox"
                            value="Full Marathon"
                            checked={sendEmailForm.categories.includes('Full Marathon')}
                            onChange={handleSendEmailFormChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="category-full" className="ml-2 block text-sm text-gray-900">
                            Full Marathon
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="category-fun"
                            name="categories"
                            type="checkbox"
                            value="Fun Run"
                            checked={sendEmailForm.categories.includes('Fun Run')}
                            onChange={handleSendEmailFormChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="category-fun" className="ml-2 block text-sm text-gray-900">
                            Fun Run
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={closeSendModal}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const TemplatesView = () => (
    <div className="h-full flex overflow-hidden">
      {/* Left sidebar - Template list */}
      <div className="w-72 border-r border-gray-200 bg-white">
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Templates</h2>
          <button
            onClick={() => openModal()}
            className="p-1 rounded-full text-primary-600 hover:bg-primary-50"
            title="Create new template"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 13rem)" }}>
          <ul className="divide-y divide-gray-200">
            {loading && templates.length === 0 ? (
              <div className="p-4">
                <Loading />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-8 text-center">
                <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first email template.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => openModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    New Template
                  </button>
                </div>
              </div>
            ) : (
              templates.map((template) => (
                <li key={template._id}>
                  <button
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none ${
                      selectedTemplate && selectedTemplate._id === template._id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <EnvelopeIcon className="h-4 w-4 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{template.name}</h3>
                          {selectedTemplate && selectedTemplate._id === template._id && (
                            <StarIcon className="h-4 w-4 text-primary-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category === 'pre-race'
                          ? 'Pre-Race'
                          : template.category === 'race-day'
                          ? 'Race Day'
                          : 'Post-Race'}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(template.createdAt)}</span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={openSendModal}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={templates.length === 0}
          >
            <EnvelopeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Send Email
          </button>
        </div>
      </div>
      
      {/* Right side - Template content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {selectedTemplate ? (
          <div className="h-full flex flex-col">
            {/* Email header */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-medium text-gray-900">{selectedTemplate.subject}</h1>
                  <div className="mt-1 flex items-center">
                    <p className="text-sm text-gray-500">
                      From: <span className="text-gray-900">admin@econet-marathon.com</span>
                    </p>
                    <p className="ml-4 text-sm text-gray-500">
                      {formatDate(selectedTemplate.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal(selectedTemplate)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedTemplate._id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedTemplate.variables && selectedTemplate.variables.map((variable, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {variable}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Email content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
                </div>
              </div>
            </div>
            
            {/* Email attachments (if any) */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center text-sm text-gray-500">
                <LinkIcon className="h-5 w-5 text-gray-400 mr-2" />
                No attachments
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No template selected</h3>
              <p className="mt-1 text-sm text-gray-500">Select a template from the list to view its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const AnnouncementsView = () => (
    <div className="h-full flex flex-col">
      <div className="bg-white shadow p-6 border-b">
        <h1 className="text-2xl font-semibold text-gray-900">Send Announcements</h1>
        <p className="mt-1 text-sm text-gray-500">Create and send in-app announcements to runners</p>
      </div>

      {/* Send Announcement Form */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <MegaphoneIcon className="h-5 w-5 mr-2 text-primary-500" />
              New Announcement
            </h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={sendAnnouncement}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={sendAnnouncementForm.title}
                    onChange={handleSendAnnouncementFormChange}
                    required
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Race Day Weather Update"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows="6"
                    value={sendAnnouncementForm.message}
                    onChange={handleSendAnnouncementFormChange}
                    required
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Due to expected rain, please bring appropriate gear for the marathon tomorrow."
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Send to Categories
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input
                          id="announcement-half"
                          name="categories"
                          type="checkbox"
                          value="Half Marathon"
                          checked={sendAnnouncementForm.categories.includes('Half Marathon')}
                          onChange={handleSendAnnouncementFormChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="announcement-half" className="ml-2 block text-sm text-gray-900">
                          Half Marathon
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="announcement-full"
                          name="categories"
                          type="checkbox"
                          value="Full Marathon"
                          checked={sendAnnouncementForm.categories.includes('Full Marathon')}
                          onChange={handleSendAnnouncementFormChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="announcement-full" className="ml-2 block text-sm text-gray-900">
                          Full Marathon
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="announcement-fun"
                          name="categories"
                          type="checkbox"
                          value="Fun Run"
                          checked={sendAnnouncementForm.categories.includes('Fun Run')}
                          onChange={handleSendAnnouncementFormChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="announcement-fun" className="ml-2 block text-sm text-gray-900">
                          Fun Run
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700">
                      Schedule Date/Time (Optional)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="datetime-local"
                        name="scheduleDate"
                        id="scheduleDate"
                        value={sendAnnouncementForm.scheduleDate}
                        onChange={handleSendAnnouncementFormChange}
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty to send immediately
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSendingAnnouncement}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingAnnouncement ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <MegaphoneIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Send Announcement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <button
            onClick={() => setView('templates')}
            className={`${
              view === 'templates'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <EnvelopeIcon className={`${
              view === 'templates' ? 'text-primary-500' : 'text-gray-400'
            } -ml-0.5 mr-2 h-5 w-5`} />
            Email Templates
          </button>
          <button
            onClick={() => setView('announcements')}
            className={`${
              view === 'announcements'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <MegaphoneIcon className={`${
              view === 'announcements' ? 'text-primary-500' : 'text-gray-400'
            } -ml-0.5 mr-2 h-5 w-5`} />
            Announcements
          </button>
        </nav>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'templates' ? <TemplatesView /> : <AnnouncementsView />}
      </div>
      
      {/* Modals */}
      {isModalOpen && <TemplateModal />}
      {isSendModalOpen && <SendEmailModal />}
    </div>
  );
}