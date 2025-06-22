import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CRM = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [contactsRes, leadsRes, projectsRes, tasksRes, companiesRes, notificationsRes, insightsRes, statsRes] = await Promise.all([
        axios.get(`${API}/contacts`),
        axios.get(`${API}/leads`),
        axios.get(`${API}/projects`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/companies`),
        axios.get(`${API}/notifications`),
        axios.get(`${API}/insights`),
        axios.get(`${API}/dashboard/stats`)
      ]);
      
      setContacts(contactsRes.data);
      setLeads(leadsRes.data);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setCompanies(companiesRes.data);
      setNotifications(notificationsRes.data);
      setInsights(insightsRes.data);
      setDashboardStats(statsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };

  const loadInteractions = async (contactId) => {
    try {
      const response = await axios.get(`${API}/interactions?contact_id=${contactId}`);
      setInteractions(response.data);
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  };

  const handleCreate = async (endpoint, data, resetForm) => {
    try {
      await axios.post(`${API}/${endpoint}`, data);
      resetForm();
      loadDashboardData();
    } catch (error) {
      console.error(`Error creating ${endpoint}:`, error);
      alert(`Error creating ${endpoint}`);
    }
  };

  const handleUpdate = async (endpoint, id, data, resetForm) => {
    try {
      await axios.put(`${API}/${endpoint}/${id}`, data);
      resetForm();
      loadDashboardData();
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error);
      alert(`Error updating ${endpoint}`);
    }
  };

  const handleDelete = async (endpoint, id, itemName) => {
    if (window.confirm(`Are you sure you want to delete this ${itemName}?`)) {
      try {
        await axios.delete(`${API}/${endpoint}/${id}`);
        loadDashboardData();
      } catch (error) {
        console.error(`Error deleting ${endpoint}:`, error);
        alert(`Error deleting ${endpoint}`);
      }
    }
  };

  const handleCreateContact = (contactData) => {
    if (editingItem) {
      handleUpdate('contacts', editingItem.id, contactData, () => {
        setShowContactForm(false);
        setEditingItem(null);
      });
    } else {
      handleCreate('contacts', contactData, () => setShowContactForm(false));
    }
  };

  const handleCreateLead = (leadData) => {
    if (editingItem) {
      handleUpdate('leads', editingItem.id, leadData, () => {
        setShowLeadForm(false);
        setEditingItem(null);
      });
    } else {
      handleCreate('leads', leadData, () => setShowLeadForm(false));
    }
  };

  const handleCreateProject = (projectData) => {
    if (editingItem) {
      handleUpdate('projects', editingItem.id, projectData, () => {
        setShowProjectForm(false);
        setEditingItem(null);
      });
    } else {
      handleCreate('projects', projectData, () => setShowProjectForm(false));
    }
  };

  const handleCreateTask = (taskData) => {
    if (editingItem) {
      handleUpdate('tasks', editingItem.id, taskData, () => {
        setShowTaskForm(false);
        setEditingItem(null);
      });
    } else {
      handleCreate('tasks', taskData, () => setShowTaskForm(false));
    }
  };

  const handleCreateCompany = (companyData) => {
    if (editingItem) {
      handleUpdate('companies', editingItem.id, companyData, () => {
        setShowCompanyForm(false);
        setEditingItem(null);
      });
    } else {
      handleCreate('companies', companyData, () => setShowCompanyForm(false));
    }
  };

  const handleCreateInteraction = async (interactionData) => {
    try {
      await axios.post(`${API}/interactions`, interactionData);
      setShowInteractionForm(false);
      loadDashboardData();
      if (selectedContact) {
        loadInteractions(selectedContact.id);
      }
    } catch (error) {
      console.error('Error creating interaction:', error);
    }
  };

  const handleEditItem = (item, formType) => {
    setEditingItem(item);
    switch (formType) {
      case 'contact':
        setShowContactForm(true);
        break;
      case 'lead':
        setShowLeadForm(true);
        break;
      case 'project':
        setShowProjectForm(true);
        break;
      case 'task':
        setShowTaskForm(true);
        break;
      case 'company':
        setShowCompanyForm(true);
        break;
      default:
        break;
    }
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/import/contacts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Import completed: ${response.data.imported_count} contacts imported, ${response.data.errors.length} errors`);
      loadDashboardData();
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/export/contacts`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting contacts:', error);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      loadDashboardData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      prospect: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-blue-100 text-blue-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      planning: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Consulting CRM</h1>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="relative p-2 text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a6 6 0 00-12 0v3L8 17h7z" />
                  </svg>
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>
              </div>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                className="hidden"
                id="file-import"
              />
              <label
                htmlFor="file-import"
                className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Import CSV
              </label>
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'contacts', label: 'Contacts' },
              { key: 'companies', label: 'Companies' },
              { key: 'leads', label: 'Leads' },
              { key: 'projects', label: 'Projects' },
              { key: 'tasks', label: 'Tasks' },
              { key: 'insights', label: 'Insights' },
              { key: 'notifications', label: `Notifications ${unreadNotifications.length > 0 ? `(${unreadNotifications.length})` : ''}` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && !loading && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Contacts</h3>
                <p className="text-3xl font-bold text-blue-600">{dashboardStats.totals?.contacts || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Companies</h3>
                <p className="text-3xl font-bold text-purple-600">{companies.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Active Leads</h3>
                <p className="text-3xl font-bold text-green-600">{dashboardStats.totals?.leads || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                <p className="text-3xl font-bold text-orange-600">{dashboardStats.totals?.projects || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Pending Tasks</h3>
                <p className="text-3xl font-bold text-red-600">{tasks.filter(t => t.status === 'pending').length}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowContactForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Contact
                </button>
                <button
                  onClick={() => setShowCompanyForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Add Company
                </button>
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Lead
                </button>
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Add Project
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>

            {/* Recent Insights */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Recent Insights & Alerts</h2>
              </div>
              <div className="p-6">
                {insights.slice(0, 5).map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 py-3 border-b last:border-b-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      insight.priority === 'high' ? 'bg-red-500' : 
                      insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{insight.title}</p>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      {insight.assigned_to && (
                        <p className="text-xs text-blue-600 mt-1">Assigned to: {insight.assigned_to}</p>
                      )}
                    </div>
                  </div>
                ))}
                {insights.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No insights available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowContactForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Contact
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(contact.last_contacted)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEditItem(contact, 'contact')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            loadInteractions(contact.id);
                            setActiveTab('interactions');
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          View History
                        </button>
                        <button
                          onClick={() => handleDelete('contacts', contact.id, 'contact')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowCompanyForm(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Add Company
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.industry}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                            {company.website}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.employees_count || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEditItem(company, 'company')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete('companies', company.id, 'company')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowLeadForm(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Lead
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.value ? `$${lead.value.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.probability}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.assigned_to || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEditItem(lead, 'lead')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete('leads', lead.id, 'lead')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowProjectForm(true);
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                Add Project
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.budget ? `$${project.budget.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(project.start_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.assigned_to || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEditItem(project, 'project')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete('projects', project.id, 'project')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowTaskForm(true);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Add Task
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.assigned_to}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(task.due_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEditItem(task, 'task')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete('tasks', task.id, 'task')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && !loading && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Insights & Alerts</h2>

            <div className="grid gap-4">
              {insights.map((insight, index) => (
                <div key={index} className="bg-white border-l-4 border-l-blue-500 p-4 rounded-r-lg shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{insight.title}</h3>
                        <span className={`text-sm font-medium ${getPriorityColor(insight.priority)}`}>
                          {insight.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{insight.description}</p>
                      {insight.assigned_to && (
                        <p className="text-sm text-blue-600 mt-2">Assigned to: {insight.assigned_to}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(insight.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No insights available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && !loading && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>

            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className={`bg-white p-4 rounded-lg shadow border-l-4 ${
                  notification.read ? 'border-l-gray-300' : 'border-l-blue-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                      {notification.recipient && (
                        <p className="text-sm text-blue-600 mt-2">To: {notification.recipient}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-500">
                        {formatDateTime(notification.created_at)}
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationRead(notification.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No notifications</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && selectedContact && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Interaction History</h2>
                <p className="text-gray-600">Contact: {selectedContact.name}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setShowInteractionForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Log Interaction
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Contacts
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{interaction.title}</h3>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {interaction.type}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{interaction.description}</p>
                      {interaction.employee && (
                        <p className="text-sm text-blue-600 mt-2">By: {interaction.employee}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(interaction.date)}
                    </div>
                  </div>
                </div>
              ))}
              {interactions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No interactions recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Forms */}
      {showContactForm && (
        <ContactForm
          contact={editingItem}
          onSubmit={handleCreateContact}
          onCancel={() => {
            setShowContactForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showCompanyForm && (
        <CompanyForm
          company={editingItem}
          onSubmit={handleCreateCompany}
          onCancel={() => {
            setShowCompanyForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showLeadForm && (
        <LeadForm
          lead={editingItem}
          contacts={contacts}
          onSubmit={handleCreateLead}
          onCancel={() => {
            setShowLeadForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showProjectForm && (
        <ProjectForm
          project={editingItem}
          contacts={contacts}
          leads={leads}
          onSubmit={handleCreateProject}
          onCancel={() => {
            setShowProjectForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showTaskForm && (
        <TaskForm
          task={editingItem}
          contacts={contacts}
          leads={leads}
          projects={projects}
          onSubmit={handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showInteractionForm && selectedContact && (
        <InteractionForm
          contact={selectedContact}
          onSubmit={handleCreateInteraction}
          onCancel={() => setShowInteractionForm(false)}
        />
      )}
    </div>
  );
};

// Contact Form Component
const ContactForm = ({ contact, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    industry: contact?.industry || '',
    position: contact?.position || '',
    address: contact?.address || '',
    notes: contact?.notes || '',
    assigned_to: contact?.assigned_to || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {contact ? 'Edit Contact' : 'Add New Contact'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name *"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Assigned To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              {contact ? 'Update Contact' : 'Create Contact'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Company Form Component
const CompanyForm = ({ company, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    industry: company?.industry || '',
    website: company?.website || '',
    phone: company?.phone || '',
    email: company?.email || '',
    address: company?.address || '',
    description: company?.description || '',
    employees_count: company?.employees_count || '',
    annual_revenue: company?.annual_revenue || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.employees_count) submitData.employees_count = parseInt(submitData.employees_count);
    if (submitData.annual_revenue) submitData.annual_revenue = parseFloat(submitData.annual_revenue);
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {company ? 'Edit Company' : 'Add New Company'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Company Name *"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="url"
            placeholder="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Number of Employees"
            value={formData.employees_count}
            onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Annual Revenue ($)"
            value={formData.annual_revenue}
            onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              {company ? 'Update Company' : 'Create Company'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lead Form Component
const LeadForm = ({ lead, contacts, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    contact_id: lead?.contact_id || '',
    title: lead?.title || '',
    description: lead?.description || '',
    status: lead?.status || 'prospect',
    value: lead?.value || '',
    probability: lead?.probability || 25,
    source: lead?.source || '',
    assigned_to: lead?.assigned_to || '',
    expected_close_date: lead?.expected_close_date ? lead.expected_close_date.split('T')[0] : ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.value) submitData.value = parseFloat(submitData.value);
    if (submitData.expected_close_date) submitData.expected_close_date = new Date(submitData.expected_close_date).toISOString();
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {lead ? 'Edit Lead' : 'Add New Lead'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            required
            value={formData.contact_id}
            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Contact *</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>{contact.name} ({contact.company})</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Lead Title *"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="prospect">Prospect</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <input
            type="number"
            placeholder="Value ($)"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-sm text-gray-600">Probability: {formData.probability}%</div>
          <input
            type="text"
            placeholder="Source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Assigned To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="Expected Close Date"
            value={formData.expected_close_date}
            onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              {lead ? 'Update Lead' : 'Create Lead'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Project Form Component
const ProjectForm = ({ project, contacts, leads, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    contact_id: project?.contact_id || '',
    lead_id: project?.lead_id || '',
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    start_date: project?.start_date ? project.start_date.split('T')[0] : '',
    end_date: project?.end_date ? project.end_date.split('T')[0] : '',
    budget: project?.budget || '',
    assigned_to: project?.assigned_to || '',
    team_members: project?.team_members?.join(', ') || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.budget) submitData.budget = parseFloat(submitData.budget);
    if (submitData.start_date) submitData.start_date = new Date(submitData.start_date).toISOString();
    if (submitData.end_date) submitData.end_date = new Date(submitData.end_date).toISOString();
    if (submitData.team_members) {
      submitData.team_members = submitData.team_members.split(',').map(m => m.trim()).filter(m => m);
    } else {
      submitData.team_members = [];
    }
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {project ? 'Edit Project' : 'Add New Project'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            required
            value={formData.contact_id}
            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Contact *</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>{contact.name} ({contact.company})</option>
            ))}
          </select>
          <select
            value={formData.lead_id}
            onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Related Lead (Optional)</option>
            {leads.map(lead => (
              <option key={lead.id} value={lead.id}>{lead.title}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Project Name *"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            placeholder="Start Date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="End Date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Budget ($)"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Assigned To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Team Members (comma separated)"
            value={formData.team_members}
            onChange={(e) => setFormData({ ...formData, team_members: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
            >
              {project ? 'Update Project' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Form Component
const TaskForm = ({ task, contacts, leads, projects, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigned_to: task?.assigned_to || '',
    contact_id: task?.contact_id || '',
    lead_id: task?.lead_id || '',
    project_id: task?.project_id || '',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    created_by: task?.created_by || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.due_date) submitData.due_date = new Date(submitData.due_date).toISOString();
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {task ? 'Edit Task' : 'Add New Task'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Task Title *"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <input
            type="text"
            placeholder="Assigned To *"
            required
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.contact_id}
            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Related Contact (Optional)</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>{contact.name} ({contact.company})</option>
            ))}
          </select>
          <select
            value={formData.lead_id}
            onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Related Lead (Optional)</option>
            {leads.map(lead => (
              <option key={lead.id} value={lead.id}>{lead.title}</option>
            ))}
          </select>
          <select
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Related Project (Optional)</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <input
            type="date"
            placeholder="Due Date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="text"
            placeholder="Created By"
            value={formData.created_by}
            onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Interaction Form Component
const InteractionForm = ({ contact, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    contact_id: contact.id,
    type: 'call',
    title: '',
    description: '',
    employee: '',
    follow_up_required: false,
    follow_up_date: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Log Interaction</h3>
        <p className="text-gray-600 mb-4">Contact: {contact.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="call">Phone Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="note">Note</option>
            <option value="task">Task</option>
          </select>
          <input
            type="text"
            placeholder="Title/Subject *"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description/Notes"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
          <input
            type="text"
            placeholder="Employee Name"
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.follow_up_required}
              onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Follow-up required</label>
          </div>
          {formData.follow_up_required && (
            <input
              type="datetime-local"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Log Interaction
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CRM;