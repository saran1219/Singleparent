import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  Bell,
  User,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Plus,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Image,
  Paperclip,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function CareGrooveJobs() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications] = useState([{ unread: true }]); // example notification
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostBox, setShowPostBox] = useState(false);
  
  // Job creation form state
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [applicationLink, setApplicationLink] = useState('');

  const API_URL_CONST = API_URL;

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  // Function to get file URL
  const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    
    let finalUrl;
    if (path.startsWith("/uploads/")) {
      finalUrl = `${API_URL}${path}`;
    } else {
      finalUrl = `${API_URL}/uploads/${path}`;
    }
    return finalUrl;
  };

  // Fetch all job posts from all users
  const fetchJobs = async () => {
    console.log('🔄 Fetching jobs...');
    setLoading(true);
    
    try {
      // Try without auth first since we made it public
      const res = await axios.get(`${API_URL_CONST}/api/posts/all-jobs`);
      console.log('✅ Jobs response:', res.data);
      const jobPosts = res.data.jobs || [];
      setJobs(jobPosts);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      
      // If public access fails, try with auth token as fallback
      const token = localStorage.getItem("userToken");
      if (token) {
        try {
          const res = await axios.get(`${API_URL_CONST}/api/posts/all-jobs`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const jobPosts = res.data.jobs || [];
          setJobs(jobPosts);
        } catch (authErr) {
          console.error("❌ Auth request also failed:", authErr.response?.data || authErr.message);
          if (authErr.response?.status === 401) {
            navigate("/login");
            return;
          }
        }
      }
      setLoading(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setContent('');
    setImageFile(null);
    setDocFile(null);
    setPosition('');
    setCompany('');
    setJobLocation('');
    setJobType('');
    setJobDescription('');
    setApplicationDeadline('');
    setApplicationLink('');
  };

  // Handle job creation
  const handleCreateJob = async () => {
    // Validation
    if (!position.trim() || !company.trim() || !jobDescription.trim()) {
      alert('Position, Company, and Job Description are required for job posts');
      return;
    }

    const token = localStorage.getItem("userToken");
    const formData = new FormData();
    formData.append("content", content || jobDescription);
    formData.append("type", "job");
    
    // Add job-specific fields
    formData.append("position", position);
    formData.append("company", company);
    formData.append("location", jobLocation);
    formData.append("jobType", jobType);
    formData.append("jobDescription", jobDescription);
    formData.append("applicationDeadline", applicationDeadline);
    formData.append("applicationLink", applicationLink);
    
    if (imageFile) formData.append("image", imageFile);
    if (docFile) formData.append("doc", docFile);

    try {
      const res = await axios.post(`${API_URL_CONST}/api/posts`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      
      const newJob = res.data.post;
      // Fix image and doc URLs
      newJob.image = newJob.image ? getFileUrl(newJob.image) : null;
      newJob.doc = newJob.doc ? getFileUrl(newJob.doc) : null;

      // Add the new job to the list
      setJobs((prev) => [newJob, ...prev]);
      
      // Reset form and close
      resetForm();
      setShowPostBox(false);
      
      alert('Job posted successfully!');
    } catch (err) {
      console.error('Error creating job:', err);
      alert('Error creating job post');
    }
  };

  // Reusable ProfilePicture component - matches Main.jsx suggestion section
  const ProfilePicture = ({ user, size = 'w-10 h-10', textSize = 'text-sm' }) => {
    const userName = user?.name || 'Anonymous';
    const profilePic = user?.profilePic;
    
    const getProfilePicUrl = (pic) => {
      if (!pic) return null;
      if (pic.startsWith('http')) return pic;
      if (pic.startsWith('/uploads/')) return `${API_URL_CONST}${pic}`;
      return `${API_URL_CONST}/uploads/${pic}`;
    };

    return (
      <div className={`${size} rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-lg`}>
        {profilePic ? (
          <img
            src={getProfilePicUrl(profilePic)}
            alt={userName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              const fallback = document.createElement('span');
              fallback.className = `text-white font-bold ${textSize}`;
              fallback.textContent = userName[0].toUpperCase();
              parent.appendChild(fallback);
            }}
          />
        ) : (
          <span className={`text-white font-bold ${textSize}`}>{userName[0].toUpperCase()}</span>
        )}
      </div>
    );
  };

  // Fetch jobs on component mount and set up periodic refresh
  useEffect(() => {
    fetchJobs();
    // Refresh jobs every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                CareGroove 
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-8">
              <button
                onClick={() => navigate("/main")}
                className="text-gray-700 hover:text-amber-600"
              >
                Home
              </button>
              <a href="#" className="text-gray-700 hover:text-orange-500">
                Explore
              </a>
              <a href="#" className="text-gray-700 hover:text-orange-500">
                Community
              </a>
              <a href="#" className="text-gray-700 hover:text-orange-500">
                Resources
              </a>
              <button
                onClick={() => navigate("/mynetwork")}
                className="text-gray-700 hover:text-amber-600"
              >
                My Networks
              </button>
            </nav>

            {/* Notification & Profile */}
            <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
              {/* Notifications */}
              <button
                className="p-2 rounded-full hover:bg-gray-100 relative"
                onClick={() => navigate("/notifications")}
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {notifications.some((n) => n.unread) && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-1 ring-white"></span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  className="p-1 rounded-full hover:bg-gray-100 border border-gray-200"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <User className="w-6 h-6 text-gray-700" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/profile");
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Discover Your Next Opportunity
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-6">
            Explore opportunities that match your passion and skills. Your
            future begins with CareGroove.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {loading ? "Loading..." : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} available`}
            </span>
            <button 
              onClick={() => {
                setLoading(true);
                fetchJobs();
              }}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              disabled={loading}
            >
              <Clock className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Job Creation Form */}
      {showPostBox && (
        <section className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Post a New Job</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                <input 
                  type="text" 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)} 
                  placeholder="e.g., Software Engineer" 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input 
                  type="text" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)} 
                  placeholder="e.g., TechCorp Inc." 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                  type="text" 
                  value={jobLocation} 
                  onChange={(e) => setJobLocation(e.target.value)} 
                  placeholder="e.g., New York, NY or Remote" 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select 
                  value={jobType} 
                  onChange={(e) => setJobType(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select job type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                <input 
                  type="date" 
                  value={applicationDeadline} 
                  onChange={(e) => setApplicationDeadline(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Link</label>
                <input 
                  type="url" 
                  value={applicationLink} 
                  onChange={(e) => setApplicationLink(e.target.value)} 
                  placeholder="https://company.com/apply" 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
              <textarea 
                value={jobDescription} 
                onChange={(e) => setJobDescription(e.target.value)} 
                placeholder="Describe the job requirements, responsibilities, and qualifications..." 
                className="w-full border border-gray-300 p-3 rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Any additional information about the job..." 
                className="w-full border border-gray-300 p-3 rounded-lg h-24 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
              />
            </div>
            
            {/* File upload section */}
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-orange-600 px-4 py-2 border border-gray-300 rounded-lg hover:border-orange-500 transition-colors">
                <Image className="w-5 h-5" />
                <span>Add Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])}/>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-orange-600 px-4 py-2 border border-gray-300 rounded-lg hover:border-orange-500 transition-colors">
                <Paperclip className="w-5 h-5" />
                <span>Add File</span>
                <input type="file" className="hidden" onChange={(e) => setDocFile(e.target.files[0])}/>
              </label>
            </div>
            
            {/* File preview */}
            {(imageFile || docFile) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                {imageFile && <p className="text-sm text-gray-600 flex items-center gap-1 mb-1"><Image className="w-4 h-4" /> Image: {imageFile.name}</p>}
                {docFile && <p className="text-sm text-gray-600 flex items-center gap-1"><Paperclip className="w-4 h-4" /> File: {docFile.name}</p>}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { resetForm(); setShowPostBox(false); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateJob}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Post Job
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Job Listings */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Loading job posts...</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No job posts available</div>
            <p className="text-gray-400 mb-6">Be the first to post a job opportunity!</p>
            <button 
              onClick={() => {
                setShowPostBox(true);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Job Post
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* Job Header */}
                <div className="flex items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ProfilePicture user={job.user} size="w-8 h-8" textSize="text-xs" />
                      <span className="text-sm text-gray-600 font-medium">{job.user?.name || 'Anonymous'}</span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Job Content */}
                <div className="mb-4">
                  {/* Structured Job Information */}
                  {job.jobDetails ? (
                    <div className="space-y-3">
                      {/* Job Title and Company */}
                      {(job.jobDetails.position || job.jobDetails.company) && (
                        <div>
                          {job.jobDetails.position && (
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {job.jobDetails.position}
                            </h3>
                          )}
                          {job.jobDetails.company && (
                            <p className="text-lg font-semibold text-gray-700 mb-2">
                              {job.jobDetails.company}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Job Meta Information */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        {job.jobDetails.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.jobDetails.location}</span>
                          </div>
                        )}
                        {job.jobDetails.jobType && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              {job.jobDetails.jobType}
                            </span>
                          </div>
                        )}
                        {job.jobDetails.applicationDeadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Apply by: {new Date(job.jobDetails.applicationDeadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Job Description */}
                      {job.jobDetails.jobDescription && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Job Description:</h4>
                          <p className="text-gray-700 text-sm leading-relaxed mb-3">
                            {job.jobDetails.jobDescription}
                          </p>
                        </div>
                      )}
                      
                      {/* Additional Notes */}
                      {job.content && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Additional Information:</h4>
                          <p className="text-gray-700 text-sm leading-relaxed mb-3">
                            {job.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Fallback for jobs without structured data
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {job.content}
                    </p>
                  )}
                  
                  {/* Job Image */}
                  {job.image && (
                    <div className="rounded-lg overflow-hidden mb-3">
                      <img
                        src={getFileUrl(job.image)}
                        alt="Job post"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.log('Job image failed to load:', job.image);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Document attachment */}
                  {job.doc && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <DollarSign className="w-4 h-4" />
                      <span>Attachment: {job.doc.split('/').pop()}</span>
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                {job.jobDetails?.applicationLink ? (
                  <a 
                    href={job.jobDetails.applicationLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    Apply Now
                  </a>
                ) : (
                  <button 
                    onClick={() => alert('Contact the job poster for application details')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    Contact Poster
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          © 2025 CareGroove. All rights reserved.
        </div>
      </footer>
      {/* Floating Plus Button */}
      <button 
        onClick={() => {
          setShowPostBox(!showPostBox);
          if (!showPostBox) {
            // Scroll to the top when opening the post box
            setTimeout(() => {
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }, 100);
          }
        }}
        className={`fixed bottom-8 right-8 w-14 h-14 ${showPostBox ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group`}
        title={showPostBox ? "Close" : "Post a Job"}
      >
        <Plus className={`w-6 h-6 transition-transform duration-300 ${showPostBox ? 'rotate-45' : 'group-hover:rotate-90'}`} />
      </button>
    </div>
  );
}