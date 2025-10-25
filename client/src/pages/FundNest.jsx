import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, User, Bell } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

const FundNest = () => {
  const [activeTab, setActiveTab] = useState('most-urgent');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]); // local notifications placeholder
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  // Currency formatter for INR
  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        
        const response = await axios.get(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch campaigns from backend
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/campaigns`);
        if (response.data.success) {
          const campaignsData = response.data.campaignsList || [];
          
          // Categorize campaigns
          const mostUrgent = campaignsData.filter(c => c.priority === 'most-urgent');
          const recentlyAdded = [...campaignsData].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          const highestFunded = [...campaignsData].sort((a, b) => b.raised - a.raised);
          
          setCampaigns({
            'most-urgent': mostUrgent,
            'recently-added': recentlyAdded,
            'highest-funded': highestFunded
          });
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        // Keep fallback static data if backend fails
      }
    };
    
    fetchCampaigns();
  }, []);

  // Fallback static campaigns (will be replaced by backend data)
  const [campaigns, setCampaigns] = useState({
    'most-urgent': [
      {
        id: 1,
        title: 'School Supplies for Children of Single Parents',
        description:
          'Single-parent families often struggle to buy basic school supplies. This campaign provides uniforms, books and stationery so children can attend school with dignity and confidence.',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=500&fit=crop',
        raised: 45000,
        goal: 75000,
        organization: 'CareGroove Education Trust',
        email: 'education@caregroove.org',
        phone: '+91 98765 43210',
        bankAccount: 'XXXX XXXX XXXX 1234',
        ifsc: 'XXXX0001234',
        upi: 'caregroove@upi',
      },
      {
        id: 2,
        title: 'Tuition Support for Single-Parent Students',
        description:
          'Many single parents cannot afford extra tuition for their children. This fund sponsors after-school tuition, remedial classes and tutoring so learners do not fall behind.',
        image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&h=500&fit=crop',
        raised: 12600,
        goal: 20000,
        organization: 'SingleParent Support',
        email: 'tuition@singleparents.in',
        phone: '+91 91234 56789',
        bankAccount: 'XXXX XXXX XXXX 9876',
        ifsc: 'SPRT0005678',
        upi: 'singleparents@upi',
      },
      {
        id: 3,
        title: 'Transport & School Fees for Children',
        description:
          'Transport and monthly school fees can be a heavy burden for single parents. This campaign helps cover bus passes and school-term fees for low-income families.',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=500&fit=crop',
        raised: 6785,
        goal: 15000,
        organization: 'Helping Hands Foundation',
        email: 'support@helpinghands.org',
        phone: '+91 99876 54321',
        bankAccount: 'XXXX XXXX XXXX 2468',
        ifsc: 'HHFD0002468',
        upi: 'helpinghands@upi',
      }
    ],
    'recently-added': [
      {
        id: 4,
        title: 'Emergency Scholarship for Single Moms',
        description:
          'When a single parent faces an unexpected crisis, children education is often the first casualty. Emergency scholarships cover immediate school expenses so studies can continue uninterrupted.',
        image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&h=500&fit=crop',
        raised: 30200,
        goal: 50000,
        organization: 'Relief & Education Collective',
        email: 'scholarship@reliefedu.in',
        phone: '+91 91111 22233',
        bankAccount: 'XXXX XXXX XXXX 1122',
        ifsc: 'REC0001122',
        upi: 'reliefedu@upi',
      },
      {
        id: 5,
        title: "Digital Devices for Remote Learning",
        description:
          'Many children of single-parent households lack access to devices for online classes. This campaign provides low-cost tablets and connectivity support to keep learning on track.',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=500&fit=crop',
        raised: 18400,
        goal: 25000,
        organization: 'EduAccess Initiative',
        email: 'digital@eduaccess.org',
        phone: '+91 90000 11122',
        bankAccount: 'XXXX XXXX XXXX 3344',
        ifsc: 'EDUA0003344',
        upi: 'eduaccess@upi',
      },
      {
        id: 6,
        title: 'School Uniforms Drive',
        description:
          'Uniforms boost confidence and reduce stigma. This drive supplies uniforms and shoes to children of single-parent families before the school term starts.',
        image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&h=500&fit=crop',
        raised: 22150,
        goal: 40000,
        organization: 'Uniforms for Hope',
        email: 'uniforms@hope.org',
        phone: '+91 95555 66677',
        bankAccount: 'XXXX XXXX XXXX 5566',
        ifsc: 'UFH0005566',
        upi: 'uniforms@upi',
      }
    ],
    'highest-funded': [
      {
        id: 7,
        title: 'Scholarships for Higher Education (Single Parents)',
        description:
          'Support driven students from single-parent homes to pursue higher secondary and college education through need-based scholarships and mentorship programs.',
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=500&fit=crop',
        raised: 85000,
        goal: 100000,
        organization: 'Education First Foundation',
        email: 'scholarships@educationfirst.in',
        phone: '+91 90011 22334',
        bankAccount: 'XXXX XXXX XXXX 7788',
        ifsc: 'EFF0007788',
        upi: 'educationfirst@upi',
      }
    ]
  });

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  const goToSection = (sectionId) => {
    navigate("/main", { state: { scrollTo: sectionId } });
  };


  // Open edit form with campaign data
  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setIsFormOpen(true);
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.delete(
        `${API_URL}/api/campaigns/${campaignId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (window.showToast) window.showToast('Campaign deleted successfully', 'success');
        // Refresh campaigns
        const refreshResponse = await axios.get(`${API_URL}/api/campaigns`);
        if (refreshResponse.data.success) {
          const campaignsData = refreshResponse.data.campaignsList || [];
          const mostUrgent = campaignsData.filter(c => c.priority === 'most-urgent');
          const recentlyAdded = [...campaignsData].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          const highestFunded = [...campaignsData].sort((a, b) => b.raised - a.raised);
          
          setCampaigns({
            'most-urgent': mostUrgent,
            'recently-added': recentlyAdded,
            'highest-funded': highestFunded
          });
        }
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      if (window.showToast) window.showToast(error.response?.data?.message || 'Failed to delete campaign', 'error');
    }
  };

  // Campaign card with payment details toggle
  const CampaignCard = ({ campaign }) => {
    const [showPayment, setShowPayment] = useState(false);
    const isCreator = currentUser && campaign.creator && 
      (campaign.creator._id === currentUser._id || campaign.creator === currentUser._id);

    // calculate percentage for progress bar
    const percentage = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative overflow-hidden h-48">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
        </div>

        <div className="p-5">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
            {campaign.title}
          </h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {campaign.description}
          </p>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">
                Raised: <span className="font-semibold text-gray-900">{inr.format(campaign.raised)}</span>
              </span>
              <span className="text-gray-700">
                Goal: <span className="font-semibold text-gray-900">{inr.format(campaign.goal)}</span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
                role="progressbar"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{percentage}% funded</div>
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 mr-2 text-yellow-600" />
              <span>{campaign.organization}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-yellow-600" />
              <span className="truncate">{campaign.email}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-yellow-600" />
              <span>{campaign.phone}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-yellow-600" />
              <span>Payment details (bank & UPI) provided by organizer</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              className="w-full border border-gray-200 bg-white text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
              onClick={() => setShowPayment(prev => !prev)}
              aria-expanded={showPayment}
            >
              {showPayment ? 'Hide Payment Details' : 'View Payment Details to Donate'}
            </button>

            {showPayment && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                <p className="text-gray-700 mb-3 font-medium">Use these details to donate:</p>
                <div className="space-y-2 mb-3">
                  <div>
                    <strong className="text-gray-700">Bank Account:</strong>
                    <div className="mt-1 text-gray-900">{campaign.bankAccount || 'Not provided'}</div>
                  </div>
                  <div>
                    <strong className="text-gray-700">IFSC Code:</strong>
                    <div className="mt-1 text-gray-900">{campaign.ifsc || 'Not provided'}</div>
                  </div>
                  <div>
                    <strong className="text-gray-700">UPI ID:</strong>
                    <div className="mt-1 text-gray-900">{campaign.upi || 'Not provided'}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                  <strong>Note:</strong> Please contact {campaign.email} or {campaign.phone} for any donation queries.
                </div>
              </div>
            )}

            {isCreator && (
              <div className="space-y-2">
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                  onClick={() => handleEditCampaign(campaign)}
                >
                  Edit Campaign
                </button>
                <button
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition"
                  onClick={() => handleDeleteCampaign(campaign._id || campaign.id)}
                >
                  Delete Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

      const handleSubmit = async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);

      try {
        const token = localStorage.getItem("userToken");
        
        if (!token) {
          alert("Please login to create a campaign");
          navigate("/login");
          return;
        }

        // Check if editing or creating
        const isEditing = editingCampaign !== null;
        const url = isEditing 
          ? `${API_URL}/api/campaigns/${editingCampaign._id || editingCampaign.id}`
          : `${API_URL}/api/campaigns`;
        const method = isEditing ? 'put' : 'post';

        // Send to backend
        const response = await axios[method](
          url,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );

        if (response.data.success) {
          if (window.showToast) window.showToast(isEditing ? 'Campaign updated successfully!' : 'Campaign created successfully!', 'success');
          setIsFormOpen(false);
          setEditingCampaign(null);
          
          // Refresh campaigns from backend
          const refreshResponse = await axios.get(`${API_URL}/api/campaigns`);
          if (refreshResponse.data.success) {
            const campaignsData = refreshResponse.data.campaignsList || [];
            const mostUrgent = campaignsData.filter(c => c.priority === 'most-urgent');
            const recentlyAdded = [...campaignsData].sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            );
            const highestFunded = [...campaignsData].sort((a, b) => b.raised - a.raised);
            
            setCampaigns({
              'most-urgent': mostUrgent,
              'recently-added': recentlyAdded,
              'highest-funded': highestFunded
            });
          }
        }
      } catch (error) {
        console.error("Error creating campaign:", error);
        if (window.showToast) window.showToast(error.response?.data?.message || 'Failed to create campaign. Please try again.', 'error');
      }
    };


  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md fixed w-full top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CareGroove</span>
            </div>

            <div className="hidden md:flex space-x-8">
              <button onClick={() => navigate("/main")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Home</button>
              <button onClick={() => goToSection("resources")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Explore</button>
              <button onClick={() => goToSection("community")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Community</button>
              <button onClick={() => goToSection("resources")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Resources</button>
              <button onClick={() => navigate("/mynetworks")} className="text-gray-700 hover:text-amber-600 cursor-pointer">My Networks</button>
            </div>

            <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
              <div className="relative">
                <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => navigate("/notifications")}>
                  <Bell className="w-6 h-6 text-gray-700" />
                  {notifications?.some(n => n.unread) && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-1 ring-white"></span>
                  )}
                </button>
              </div>
              <div className="relative">
                <button className="p-1 rounded-full hover:bg-gray-100 border border-gray-200" onClick={() => setShowDropdown(!showDropdown)}>
                  <User className="w-6 h-6 text-gray-700" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg py-2 z-50">
                    <button onClick={() => { setShowDropdown(false); navigate("/profile"); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">View Profile</button>
                    <button onClick={() => { setShowDropdown(false); handleLogout(); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Floating Create Button */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center z-50">
        <button
          className="bg-amber-500 hover:bg-amber-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg transition"
          onClick={() => setIsFormOpen(true)}
        >
          +
        </button>
        <span className="mt-1 text-sm font-medium text-gray-700">Create</span>
      </div>
            {/* Campaign Form Modal - Horizontal Layout */}
          {isFormOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
    <div className="bg-white w-full max-w-4xl max-h-[90vh] p-6 rounded-lg shadow-lg relative flex flex-col md:flex-row gap-6 overflow-auto">
      {/* Close Button */}
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        onClick={() => {
          setIsFormOpen(false);
          setEditingCampaign(null);
        }}
      >
        ✕
      </button>

      {/* Left: Image Preview / Placeholder */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 rounded-lg p-4">
        <img
          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
          alt="Preview"
          className="object-cover w-full max-h-[70vh] rounded-lg"
        />
      </div>

      {/* Right: Form */}
      <div className="w-full md:w-1/2 overflow-auto">
        <h2 className="text-xl font-bold mb-4">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Form fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input 
              type="text" 
              name="title" 
              required 
              defaultValue={editingCampaign?.title || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description" 
              required 
              defaultValue={editingCampaign?.description || ''}
              className="mt-1 w-full border rounded-md p-2" 
              rows="3" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <input 
              type="text" 
              name="organization" 
              required 
              defaultValue={editingCampaign?.organization || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              name="email" 
              required 
              defaultValue={editingCampaign?.email || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input 
              type="text" 
              name="phone" 
              required 
              defaultValue={editingCampaign?.phone || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Account</label>
            <input 
              type="text" 
              name="bankAccount" 
              defaultValue={editingCampaign?.bankAccount || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">IFSC</label>
            <input 
              type="text" 
              name="ifsc" 
              defaultValue={editingCampaign?.ifsc || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">UPI ID</label>
            <input 
              type="text" 
              name="upi" 
              defaultValue={editingCampaign?.upi || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Goal Amount (INR)</label>
            <input 
              type="number" 
              name="goal" 
              required 
              defaultValue={editingCampaign?.goal || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Raised Amount</label>
            <input 
              type="number" 
              name="raised" 
              defaultValue={editingCampaign?.raised || ''}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {editingCampaign ? 'Upload New Image (optional)' : 'Upload Image'}
            </label>
            <input type="file" name="image" accept="image/*" className="mt-1 w-full" />
            {editingCampaign?.image && (
              <p className="text-xs text-gray-500 mt-1">Current image will be kept if no new image is uploaded</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingCampaign(null);
              }}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-md"
            >
              {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Active Campaigns for Single-Parent Children</h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('most-urgent')}
            className={`pb-4 px-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'most-urgent'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Most Urgent
          </button>
          <button
            onClick={() => setActiveTab('recently-added')}
            className={`pb-4 px-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'recently-added'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recently Added
          </button>
          <button
            onClick={() => setActiveTab('highest-funded')}
            className={`pb-4 px-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'highest-funded'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Highest Funded
          </button>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {campaigns[activeTab] && campaigns[activeTab].length > 0 ? (
            campaigns[activeTab].map(campaign => (
              <CampaignCard key={campaign._id || campaign.id} campaign={campaign} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No campaigns available in this category.</p>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
              >
                Create First Campaign
              </button>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Empowering Single Parents & Their Children</h2>
            <p className="text-gray-600">Support focused initiatives that keep kids learning — from supplies to scholarships.</p>
          </div>
          <div className="mt-6 md:mt-0">
            <img
              src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=500&fit=crop"
              alt="Community"
              className="w-64 h-32 object-cover rounded-lg"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          © 2025 CareGroove. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default FundNest;
