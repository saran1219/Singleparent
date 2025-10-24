import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Users, 
  MapPin, 
  FileText, 
  Bell, 
  Target, 
  Paperclip, 
  Image ,
  Trash2,
  Heart,
  Share
} from 'lucide-react';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function GrowConnectProfile({ notifications, setNotifications }) {
  const { userId } = useParams(); // Get userId from URL params
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('posts');
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileFile, setProfileFile] = useState(null); 
  const [profilePic, setProfilePic] = useState(''); 
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  
  // Check if viewing own profile or another user's profile
  const isOwnProfile = !userId;

  // Function to render post/thought images/docs with backend URL
  const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    
    let finalUrl;
    if (path.startsWith("/uploads/")) {
      finalUrl = `${API_URL}${path}`;
    } else {
      finalUrl = `${API_URL}/uploads/${path}`;
    }
    
    console.log('getFileUrl:', path, '->', finalUrl);
    return finalUrl;
  };

  const interestOptions = ["UI/UX Design", "Product Management", "Storytelling", "Prototyping", "Communication", "Figma"];

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  // Fetch profile & posts
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile data - use different endpoint for other users
        const profileEndpoint = isOwnProfile ? "/api/user/profile" : `/api/user/profile/${userId}`;
        const profileRes = await axios.get(profileEndpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const u = profileRes.data.user;

        setUser(u);
        // Fix profile picture URL construction
        if (u.profilePic) {
          if (u.profilePic.startsWith('http')) {
            setProfilePic(u.profilePic);
          } else if (u.profilePic.startsWith('/uploads/')) {
            setProfilePic(`${API_URL}${u.profilePic}`);
          } else {
            setProfilePic(`${API_URL}/uploads/${u.profilePic}`);
          }
        } else {
          setProfilePic('');
        }
        setLocation(u.location || '');
        setBio(u.bio || '');

        let parsedInterests = [];
        if (Array.isArray(u.interests)) {
          parsedInterests = u.interests;
        } else if (typeof u.interests === 'string') {
          try {
            parsedInterests = JSON.parse(u.interests || "[]");
            if (!Array.isArray(parsedInterests)) parsedInterests = parsedInterests ? [parsedInterests] : [];
          } catch (e) {
            parsedInterests = u.interests ? [u.interests] : [];
          }
        }
        setInterests(parsedInterests);

        // Fetch posts data - use different endpoint for other users
        const postsEndpoint = isOwnProfile ? "/api/posts/my-posts" : `/api/posts/user-posts/${userId}`;
        const postsRes = await axios.get(postsEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allPosts = postsRes.data.posts || [];
        console.log('Fetched posts:', allPosts);
        
        // Process posts and fix image URLs
        const processedPosts = allPosts.map(post => ({
          ...post,
          image: post.image ? getFileUrl(post.image) : null,
          doc: post.doc ? getFileUrl(post.doc) : null
        }));
        
        setPosts(processedPosts.filter((p) => p.type === "job"));
        setThoughts(processedPosts.filter((p) => p.type === "thought"));

        setLoading(false);
      } catch (err) {
        console.error("Profile or posts fetch error:", err);
        if (err.response?.status === 404) {
          alert("User not found");
          navigate("/main");
        } else if (err.response?.status === 401) {
          localStorage.removeItem("userToken");
          navigate("/login");
        } else {
          alert("Error loading profile");
          navigate("/main");
        }
      }
    };

    fetchData();
  }, [navigate, API_URL, userId, isOwnProfile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update profile
  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const formData = new FormData();
      if (profileFile) formData.append("profilePic", profileFile);
      formData.append("location", location);
      formData.append("bio", bio);
      formData.append("interests", JSON.stringify(interests));

      const res = await axios.put("/api/user/profile", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      setUser(res.data.user);
      // Fix profile picture URL after update
      const updatedPic = res.data.user.profilePic;
      if (updatedPic) {
        if (updatedPic.startsWith('http')) {
          setProfilePic(updatedPic);
        } else if (updatedPic.startsWith('/uploads/')) {
          setProfilePic(`${API_URL}${updatedPic}`);
        } else {
          setProfilePic(`${API_URL}/uploads/${updatedPic}`);
        }
      } else {
        setProfilePic('');
      }
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }
  };
  const handleDeletePost = async (id, type) => {
  if (!window.confirm("Are you sure you want to delete this post?")) return;

  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.delete(`/api/posts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("🗑 Delete success:", res.data);
    console.log("Deleting type:", type, "with ID:", id);

    if (type === "job") {
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } 
    else {
      console.warn("Unknown type:", type);
    }
    if (type === "thought") {
      setThoughts((prev) => prev.filter((t) => t._id !== id));
    } else {
      console.warn("Unknown type:", type);
    }

    alert("Post deleted successfully!");
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete post");
  }
};



  if (loading) return <div className="p-6">Loading profile...</div>;
  if (!user) return <div className="p-6">No profile found</div>;

  const goToSection = (sectionId) => navigate("/main", { state: { scrollTo: sectionId } });

  // Create Post component
  const CreatePostFlow = ({ type }) => {
    const [showBox, setShowBox] = useState(false);
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [docFile, setDocFile] = useState(null);
    
    // Job-specific fields
    const [position, setPosition] = useState('');
    const [company, setCompany] = useState('');
    const [jobLocation, setJobLocation] = useState('');
    const [jobType, setJobType] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [applicationDeadline, setApplicationDeadline] = useState('');
    const [applicationLink, setApplicationLink] = useState('');

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

    const handleAddPost = async () => {
      // Validation for job posts
      if (type === 'job') {
        if (!position.trim() || !company.trim() || !jobDescription.trim()) {
          alert('Position, Company, and Job Description are required for job posts');
          return;
        }
      } else {
        if (!content.trim() && !imageFile && !docFile) return;
      }

      const token = localStorage.getItem("userToken");
      const formData = new FormData();
      formData.append("content", content || (type === 'job' ? jobDescription : ''));
      formData.append("type", type);
      
      // Add job-specific fields if this is a job post
      if (type === 'job') {
        formData.append("position", position);
        formData.append("company", company);
        formData.append("location", jobLocation);
        formData.append("jobType", jobType);
        formData.append("jobDescription", jobDescription);
        formData.append("applicationDeadline", applicationDeadline);
        formData.append("applicationLink", applicationLink);
      }
      
      if (imageFile) formData.append("image", imageFile);
      if (docFile) formData.append("doc", docFile);

      try {
        const res = await axios.post("/api/posts", formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const newPost = res.data.post;
        // Fix image and doc URLs
        newPost.image = newPost.image ? getFileUrl(newPost.image) : null;
        newPost.doc = newPost.doc ? getFileUrl(newPost.doc) : null;

        if (type === "job") setPosts((prev) => [newPost, ...prev]);
        else setThoughts((prev) => [newPost, ...prev]);

        // Reset all fields
        resetForm();
        setShowBox(false);
      } catch (err) {
        console.error(err);
        alert("Error creating post");
      }
    };
    
    if (!showBox) {
      return (
        <button onClick={() => setShowBox(true)} className="w-full bg-white border-dashed border-2 border-gray-300 text-amber-600 font-medium py-2 rounded-lg flex items-center justify-center hover:bg-gray-50 mb-4">
          <span className="text-lg font-bold mr-2">+</span> Create {type === 'job' ? 'Job Post' : 'Personal Thought'}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col space-y-3 mb-4">
        {type === 'job' ? (
          // Job Post Form
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                <input 
                  type="text" 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)} 
                  placeholder="e.g., Software Engineer" 
                  className="border p-2 rounded w-full" 
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
                  className="border p-2 rounded w-full" 
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
                  className="border p-2 rounded w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select 
                  value={jobType} 
                  onChange={(e) => setJobType(e.target.value)} 
                  className="border p-2 rounded w-full"
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
                  className="border p-2 rounded w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Link</label>
                <input 
                  type="url" 
                  value={applicationLink} 
                  onChange={(e) => setApplicationLink(e.target.value)} 
                  placeholder="https://company.com/apply" 
                  className="border p-2 rounded w-full" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
              <textarea 
                value={jobDescription} 
                onChange={(e) => setJobDescription(e.target.value)} 
                placeholder="Describe the job requirements, responsibilities, and qualifications..." 
                className="border p-2 rounded w-full h-24" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Any additional information about the job..." 
                className="border p-2 rounded w-full h-20" 
              />
            </div>
          </>
        ) : (
          // Thought Post Form
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="What's on your mind?" 
            className="border p-2 rounded w-full h-24" 
          />
        )}
        
        {/* File upload section */}
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1 cursor-pointer text-gray-600 hover:text-amber-600">
            <Image className="w-5 h-5" /> Image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])}/>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-gray-600 hover:text-amber-600">
            <Paperclip className="w-5 h-5" /> File
            <input type="file" className="hidden" onChange={(e) => setDocFile(e.target.files[0])}/>
          </label>
          <button onClick={handleAddPost} className="ml-auto bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors">
            Post {type === 'job' ? 'Job' : 'Thought'}
          </button>
          <button onClick={() => { resetForm(); setShowBox(false); }} className="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors">
            Cancel
          </button>
        </div>
        
        {/* File preview */}
        {imageFile && <p className="text-sm text-gray-500 flex items-center gap-1"><Image className="w-4 h-4" /> Image: {imageFile.name}</p>}
        {docFile && <p className="text-sm text-gray-500 flex items-center gap-1"><Paperclip className="w-4 h-4" /> File: {docFile.name}</p>}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation + Left Sidebar + Right Content remain same */}
      <nav className="bg-white/80 backdrop-blur-md fixed w-full top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CareGroove</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <button onClick={() => navigate("/main")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Home</button>
              <button onClick={() => goToSection("resources")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Explore</button>
              <button onClick={() => goToSection("community")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Community</button>
              <button onClick={() => goToSection("profiles")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Resources</button>
              <button onClick={() => navigate("/mynetwork")} className="text-gray-700 hover:text-amber-600 cursor-pointer">My Networks</button>
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
                  <img 
                    src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=40`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=40`;
                    }}
                  />
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-orange-200 rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex flex-col items-center">
                {/* Profile Picture & Edit */}
                <div className="relative w-24 h-24 mb-4">
                  <img 
                    src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=150`} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover" 
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=150`;
                    }}
                  />
                  {isEditing && isOwnProfile && (
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-600">
                      <span className="text-white text-lg font-bold">+</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file){
                          setProfileFile(file);
                          const reader = new FileReader();
                          reader.onload = () => setProfilePic(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}/>
                    </label>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-amber-700">{user.name}</h2>

                {/* Location */}
                <div className="flex items-center mt-2 justify-center text-gray-600 text-sm">
                  {isEditing && isOwnProfile ? (
                    <>
                      <MapPin className="w-4 h-4 mr-1" />
                      <input type="text" placeholder="Enter location" value={location} onChange={(e) => setLocation(e.target.value)} className="border p-1 rounded w-48 text-sm text-center"/>
                    </>
                  ) : (
                    <span className="flex items-center justify-center font-serif  text-gray-800 w-48"><MapPin className="w-4 h-4 mr-1" /> {location || "No location set"}</span>
                  )}
                </div>

                {/* Bio */}
                <div className="mt-2 flex items-start w-full px-4">
                  <div className="mr-2 mt-1"><FileText className="w-5 h-5 font-serif text-gray-800"/></div>
                  <div className="flex-1">
                    {isEditing && isOwnProfile ? (
                      <textarea placeholder="Enter bio" value={bio} onChange={(e) => setBio(e.target.value)} className="border p-1 rounded w-full text-sm"/>
                    ) : (
                      <p className="font-serif text-gray-800">{bio || "No bio added"}</p>
                    )}
                  </div>
                </div>

                {/* Interests */}
                <div className="mt-4 w-full px-4">
                  <h3 className="flex items-center gap-2 text-base font-serif text-gray-800 mb-2">
                    <Target className="w-4 h-4 text-gray-800" /> Interests
                  </h3>
                  {isEditing && isOwnProfile ? (
                    <select multiple value={interests} onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setInterests(selected);
                    }} className="border p-2 rounded w-full text-sm h-32">
                      {interestOptions.map((interest, idx) => (<option key={idx} value={interest}>{interest}</option>))}
                    </select>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {interests.length > 0 ? (
                        interests.map((interest, idx) => (<span key={idx} className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">{interest}</span>))
                      ) : (
                        <p className="text-gray-500 text-sm italic">No interests added</p>
                      )}
                    </div>
                  )}
                  {isEditing && isOwnProfile && (<p className="text-xs text-gray-500 mt-1">Hold <b>Ctrl</b> (Windows) or <b>Cmd</b> (Mac) to select multiple.</p>)}
                </div>

                {/* Buttons - Only for own profile */}
                {isOwnProfile && (
                  <>
                    {isEditing ? (
                      <div className="mt-4 flex space-x-2">
                        <button onClick={handleProfileUpdate} className="bg-amber-500 text-white px-4 py-2 rounded">Save Changes</button>
                        <button onClick={() => setIsEditing(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="mt-4 bg-amber-500 text-white px-4 py-2 rounded">Edit Profile</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('posts')} className={`flex-1 px-6 py-4 text-center font-medium ${activeTab === 'posts' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-600'}`}>
                  <Users className="w-5 h-5 inline mr-2" /> Job Posts
                </button>
                <button onClick={() => setActiveTab('thoughts')} className={`flex-1 px-6 py-4 text-center font-medium ${activeTab === 'thoughts' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-600'}`}>
                  <MessageSquare className="w-5 h-5 inline mr-2" /> Personal Thoughts
                </button>
              </div>

              {/* Persistent Create Post Flow - Only for own profile */}
              {isOwnProfile && <CreatePostFlow type={activeTab === 'posts' ? 'job' : 'thought'} />}

              {/* Posts / Thoughts Display */}
              <div className="space-y-4">
                {activeTab === 'posts'
                  ? posts.map((post) => (
                      <div key={post._id|| post.id} className="bg-white rounded-lg shadow-sm p-6">
                        {/* Header: Profile + Name */}
                        <div className="flex items-center mb-4">
                          <img
                            src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=40`}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover mr-3"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=40`;
                            }}
                          />
                          <div>
                            <h3 className="text-gray-900 font-semibold">{user.name}</h3>
                            <p className="text-xs text-gray-500">Job Post • {new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Job Details */}
                        {post.jobDetails && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              {post.jobDetails.position && (
                                <div>
                                  <h4 className="font-semibold text-lg text-gray-900">{post.jobDetails.position}</h4>
                                  {post.jobDetails.company && <p className="text-gray-700 font-medium">{post.jobDetails.company}</p>}
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                {post.jobDetails.location && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{post.jobDetails.location}</span>
                                  </div>
                                )}
                                {post.jobDetails.jobType && (
                                  <div className="inline-flex">
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                      {post.jobDetails.jobType}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {post.jobDetails.jobDescription && (
                              <div className="mb-3">
                                <h5 className="font-medium text-gray-900 mb-1">Job Description:</h5>
                                <p className="text-gray-700 text-sm leading-relaxed">{post.jobDetails.jobDescription}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row justify-between gap-2 text-sm">
                              {post.jobDetails.applicationDeadline && (
                                <div className="text-gray-600">
                                  <span className="font-medium">Apply by:</span> {new Date(post.jobDetails.applicationDeadline).toLocaleDateString()}
                                </div>
                              )}
                              {post.jobDetails.applicationLink && (
                                <a 
                                  href={post.jobDetails.applicationLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-amber-600 hover:text-amber-700 font-medium underline"
                                >
                                  Apply Now
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Additional Notes */}
                        {post.content && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-900 mb-1">Additional Notes:</h5>
                            <p className="text-gray-700 text-sm">{post.content}</p>
                          </div>
                        )}
                        {post.image && (
                          <img
                            src={getFileUrl(post.image)}
                            alt="post"
                            className="mt-2 max-h-64 w-full object-cover rounded"
                            onError={(e) => {
                              console.log('Post image failed to load:', post.image, 'Resolved URL:', getFileUrl(post.image));
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {post.doc && (
                          <p className="mt-2 text-gray-500 flex items-center">
                            <Paperclip className="w-4 h-4 mr-1" /> {post.doc}
                          </p>
                        )}

                        {/* Bottom: Like & Share */}
                        <div className="flex items-center gap-6 mt-4 border-t pt-2">
                          <button className="flex items-center gap-1 text-gray-600 hover:text-amber-600">
                            <Heart className="w-4 h-4" /> Like
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 hover:text-amber-600">
                            <Share className="w-4 h-4" /> Share
                          </button>
                          {/* 🆕 Delete Button - Only for own profile */}
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeletePost(post._id, "job")}
                            className="flex items-center gap-1 text-gray-600 hover:text-amber-600"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                        </div>
                        
                      </div>
                    ))
                  : thoughts.map((thought) => (
                      <div key={thought._id || thought.id} className="bg-white rounded-lg shadow-sm p-6">
                        {/* Header: Profile + Name */}
                        <div className="flex items-center mb-3">
                          <img
                            src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=40`}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover mr-3"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=ffffff&size=40`;
                            }}
                          />
                          <div>
                            <h3 className="text-gray-900 font-semibold">{user.name}</h3>
                            <p className="text-xs text-gray-500">Personal Thought</p>
                          </div>
                        </div>

                        {thought.content && <p className="text-gray-700 mb-2">{thought.content}</p>}
                        {thought.image && (
                          <img
                            src={getFileUrl(thought.image)}
                            alt="thought"
                            className="mt-2 max-h-64 w-full object-cover rounded"
                            onError={(e) => {
                              console.log('Thought image failed to load:', thought.image, 'Resolved URL:', getFileUrl(thought.image));
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {thought.doc && (
                          <p className="mt-2 text-gray-500 flex items-center">
                            <Paperclip className="w-4 h-4 mr-1" /> {thought.doc}
                          </p>
                        )}

                        {/* Bottom: Like & Share */}
                        <div className="flex items-center gap-6 mt-4 border-t pt-2">
                          <button className="flex items-center gap-1 text-gray-600 hover:text-amber-600">
                            <Heart className="w-4 h-4" /> Like
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 hover:text-amber-600">
                          <Share className="w-4 h-4" /> Share
                          </button>
                          {/* 🆕 Delete Button - Only for own profile */}
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeletePost(thought._id, "thought")}
                            className="flex items-center gap-1 text-gray-600 hover:text-amber-600"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                        </div>
                        
                      </div>
                    ))}  {/* end of thoughts.map */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
