import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Plus,
  Bell,
  User,
  Image,
  Paperclip,
  X,
  Share,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config';

const CareGroovePage = ({ notifications, setNotifications }) => {
  const navigate = useNavigate();
  const itemsSectionRef = useRef(null);

  // ✅ Added missing states and handlers
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // New states for post creation and database posts
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Create post form states
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  
  // Request item states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestedItems, setRequestedItems] = useState([]); // Array of post IDs user has requested

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };
  
  // Backend URL
  const API_URL_CONST = API_URL;
  
  // Function to get file URL - handles all possible path formats
  const getFileUrl = (path) => {
    if (!path) return null;
    
    // Already a full URL
    if (path.startsWith("http://") || path.startsWith("https://")) {
      console.log('getFileUrl (already full URL):', path);
      return path;
    }
    
    let finalUrl;
    
    // Path starts with /uploads/
    if (path.startsWith("/uploads/")) {
      finalUrl = `${API_URL_CONST}${path}`;
    } 
    // Path starts with uploads/ (without leading slash)
    else if (path.startsWith("uploads/")) {
      finalUrl = `${API_URL_CONST}/${path}`;
    }
    // Just the filename
    else {
      finalUrl = `${API_URL_CONST}/uploads/${path}`;
    }
    
    console.log('getFileUrl:', path, '->', finalUrl);
    return finalUrl;
  };
  
  // Fetch posts and user's requests from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("userToken");
        if (!token) {
          navigate("/login");
          return;
        }
        
        // Fetch posts and user requests in parallel
        const [postsResponse, requestsResponse] = await Promise.all([
          axios.get("/api/posts/hughand", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get("/api/item-requests/my-requests", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        console.log('Raw posts from server:', postsResponse.data.posts.length);
        postsResponse.data.posts.forEach((post, idx) => {
          console.log(`Post ${idx}:`, {
            id: post._id,
            title: post.hughandDetails?.title,
            hasImage: !!post.image,
            image: post.image
          });
        });
        
        // Process posts and fix image URLs
        const processedPosts = postsResponse.data.posts.map(post => {
          const processedPost = {
            ...post,
            image: post.image ? getFileUrl(post.image) : null,
            doc: post.doc ? getFileUrl(post.doc) : null
          };
          return processedPost;
        });
        
        console.log('Processed posts:', processedPosts.length);
      setPosts(processedPosts);
      if (processedPosts.length && window.showToast) window.showToast('Loaded latest posts', 'info');
      
      // Extract post IDs that user has requested (with pending status)
        const requestedPostIds = requestsResponse.data.sentRequests
          .filter(request => request.status === 'pending')
          .map(request => request.post._id);
        
        setRequestedItems(requestedPostIds);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("userToken");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  // Handle create post
  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim() || !category.trim()) {
      alert("Please fill in title, description, and category");
      return;
    }
    
    try {
      const token = localStorage.getItem("userToken");
      const formData = new FormData();
      
      formData.append("content", content);
      formData.append("type", "hughand");
      formData.append("title", title);
      formData.append("category", category);
      formData.append("contactEmail", contactEmail);
      formData.append("contactPhone", contactPhone);
      formData.append("address", address);
      
      if (imageFile) formData.append("image", imageFile);
      if (docFile) formData.append("doc", docFile);
      
      const response = await axios.post("/api/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      const newPost = response.data.post;
      // Process the new post with proper image URLs
      const processedNewPost = {
        ...newPost,
        image: newPost.image ? getFileUrl(newPost.image) : null,
        doc: newPost.doc ? getFileUrl(newPost.doc) : null
      };
      
      console.log('New post created with image:', newPost.image, '-> processed:', processedNewPost.image);
      
      setPosts(prev => [processedNewPost, ...prev]);
      
      // Reset form
      resetForm();
      setShowCreateCard(false);
      
      if (window.showToast) window.showToast('Post created successfully!', 'success');
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };
  
  const resetForm = () => {
    setContent('');
    setCategory('');
    setTitle('');
    setContactEmail('');
    setContactPhone('');
    setAddress('');
    setImageFile(null);
    setDocFile(null);
  };
  
  const resetRequestForm = () => {
    setRequestMessage('');
    setRequestEmail('');
    setRequestPhone('');
    setSelectedPost(null);
  };
  
  // Handle request item click
  const handleRequestItem = (post) => {
    // Check if already requested
    if (requestedItems.includes(post._id)) {
      return; // Do nothing if already requested
    }
    setSelectedPost(post);
    setShowRequestModal(true);
  };
  
  // Check if current user is the post owner
  const isPostOwner = (post) => {
    const token = localStorage.getItem("userToken");
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return post.user?._id === decoded.id;
    } catch {
      return false;
    }
  };
  
  // Submit request
  const handleSubmitRequest = async () => {
    if (!selectedPost) return;
    
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.post("/api/item-requests", {
        postId: selectedPost._id,
        message: requestMessage,
        email: requestEmail,
        phone: requestPhone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert("Request sent successfully! The owner will be notified.");
        
        // Add this post to requested items
        setRequestedItems(prev => [...prev, selectedPost._id]);
        
        setShowRequestModal(false);
        resetRequestForm();
        
        // Add notification to state if setNotifications is available
        if (setNotifications) {
          setNotifications(prev => [...prev, {
            id: Date.now(),
            unread: true,
            message: `Request sent for "${selectedPost.hughandDetails?.title || 'item'}"`,
            time: 'now',
            type: 'item_request'
          }]);
        }
      }
    } catch (error) {
      console.error("Error sending request:", error);
      alert(error.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-purple-50 relative">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            {/* Logo */}
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">CareGroove</span>
                      </div>

          <div className="flex items-center space-x-8">
            <button onClick={() => navigate("/main")} className="text-gray-700 hover:text-amber-600">Home</button>
            <button onClick={() => navigate("/main")} className="text-gray-700 hover:text-orange-500 transition-colors">Explore</button>
            <button onClick={() => navigate("/community")} className="text-gray-700 hover:text-orange-500 transition-colors">Community</button>
            <button onClick={() => navigate("/main")} className="text-gray-700 hover:text-orange-500 transition-colors">Resources</button>
            <button onClick={() => navigate("/mynetworks")} className="text-gray-700 hover:text-amber-600">My Networks</button>
          </div>

          <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
            {/* Notifications */}
            <button className="p-2 rounded-full hover:bg-gray-100 relative" onClick={() => navigate("/notifications")}>
              <Bell className="w-6 h-6 text-gray-700" />
              {notifications?.some(n => n.unread) && (
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
                    onClick={() => { setShowDropdown(false); navigate("/profile"); }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { setShowDropdown(false); handleLogout(); }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Extend a Helping Hand,<br />Receive a Warm Hug.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Parenting isn't meant to be a solo journey. Here, you'll find connection, encouragement, and people who truly understand. Join our 'Hug & Hand' community to share resources, exchange items, and offer mutual support.
            </p>
            <button
              onClick={() => {
                setShowCreateCard(true);
                setTimeout(() => {
                  const createSection = document.querySelector('.bg-white.rounded-lg.shadow-lg');
                  if (createSection) {
                    createSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition duration-200"
            >
              Start Helping Today
            </button>
          </div>
          <div className="flex-1">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-orange-200 rounded-3xl opacity-50"></div>
              <img
                src="https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&h=500&fit=crop"
                alt="Happy family"
                className="relative rounded-3xl shadow-2xl object-cover w-full h-96"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Create Post Card */}
      {showCreateCard && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Item Post</h3>
              <button
                onClick={() => setShowCreateCard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Toddler Stroller"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Baby Gear">Baby Gear</option>
                    <option value="Books & Toys">Books & Toys</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Baby Essentials">Baby Essentials</option>
                    <option value="Hobbies">Hobbies</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the item, its condition, and any relevant details..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your location for pickup/delivery"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              {/* File upload section */}
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-orange-600">
                  <Image className="w-5 h-5" /> Add Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-orange-600">
                  <Paperclip className="w-5 h-5" /> Add File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setDocFile(e.target.files[0])}
                  />
                </label>
              </div>
              
              {/* File preview */}
              {imageFile && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Image className="w-4 h-4" /> Image: {imageFile.name}
                </p>
              )}
              {docFile && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Paperclip className="w-4 h-4" /> File: {docFile.name}
                </p>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreatePost}
                  className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition"
                >
                  Create Post
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateCard(false);
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Items Section */}
      <section ref={itemsSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Items for Exchange & Donation</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find essential items you need or give back to the community by listing items you no longer use. Every little bit helps. Connect with senders directly to facilitate exchanges.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading posts...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.length > 0 ? (
              posts.map((post) => (
                  <div
                  key={post._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative">
                    {post.image ? (
                      <img 
                        src={post.image}
                        alt={post.hughandDetails?.title || post.content} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.error('❌ Image failed to load');
                          console.error('Post ID:', post._id);
                          console.error('Original image value:', post.image);
                          console.error('Attempted URL:', e.target.src);
                          
                          // Try alternative URL formats as fallback
                          if (!e.target.dataset.retried) {
                            e.target.dataset.retried = 'true';
                            // Extract just the filename if possible
                            const filename = post.image.split('/').pop();
                            console.log('Retrying with filename only:', filename);
                            e.target.src = `${API_URL}/uploads/${filename}`;
                          } else {
                            console.error('Retry also failed, hiding image');
                            e.target.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <Heart className="w-16 h-16 text-orange-400" />
                      </div>
                    )}
                    {post.hughandDetails?.category && (
                      <span className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow">
                        {post.hughandDetails.category}
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {post.hughandDetails?.title || 'Untitled Item'}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{post.content}</p>

                    <div className="space-y-2 pt-4 border-t">
                      <p className="font-semibold text-gray-900">Sender Details:</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">👤 {post.user?.name || 'Anonymous'}</p>
                        {post.hughandDetails?.contactEmail && (
                          <p className="flex items-center gap-2">
                            <Mail size={14} /> {post.hughandDetails.contactEmail}
                          </p>
                        )}
                        {post.hughandDetails?.contactPhone && (
                          <p className="flex items-center gap-2">
                            <Phone size={14} /> {post.hughandDetails.contactPhone}
                          </p>
                        )}
                        {post.hughandDetails?.address && (
                          <p className="flex items-center gap-2">
                            <MapPin size={14} /> {post.hughandDetails.address}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {post.doc && (
                      <div className="pt-2">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Paperclip className="w-4 h-4" /> Attached file available
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      {isPostOwner(post) && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this post?')) {
                              try {
                                const token = localStorage.getItem("userToken");
                                await axios.delete(`/api/posts/${post._id}`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                setPosts(prev => prev.filter(p => p._id !== post._id));
                                alert('Post deleted successfully!');
                              } catch (error) {
                                console.error('Error deleting post:', error);
                                alert('Failed to delete post');
                              }
                            }
                          }}
                          className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      )}
                      {isPostOwner(post) ? (
                        <button 
                          disabled
                          className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-medium cursor-not-allowed"
                        >
                          Your Item
                        </button>
                      ) : requestedItems.includes(post._id) ? (
                        <button 
                          disabled
                          className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-medium cursor-not-allowed"
                        >
                          Requested
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRequestItem(post)}
                          className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition"
                        >
                          Request Item
                        </button>
                      )}
                      <button className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition">
                        <Share size={16} className="inline mr-1" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">No items available yet. Be the first to share!</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Floating Upload Button */}
      <div className="fixed bottom-24 right-8 flex flex-col items-center space-y-2">
        <button 
          onClick={() => setShowCreateCard(true)}
          className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-transform"
        >
          <Plus size={28} />
        </button>
        <span className="text-sm font-semibold text-gray-700">Upload Item</span>
      </div>
      
      {/* Request Item Modal */}
      {showRequestModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Request Item</h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  resetRequestForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900">
                {selectedPost.hughandDetails?.title || 'Untitled Item'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Requesting from: {selectedPost.user?.name || 'Anonymous'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell them why you need this item or any additional details..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Contact Email
                </label>
                <input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Phone Number
                </label>
                <input
                  type="tel"
                  value={requestPhone}
                  onChange={(e) => setRequestPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitRequest}
                className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition"
              >
                Send Request
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  resetRequestForm();
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          © 2025 CareGroove. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default CareGroovePage;