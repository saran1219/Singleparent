import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Share2, Bell, User, Plus, Image, Paperclip } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_URL } from "../config";

const Groovetalks = () => {
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications] = useState([]);
  const [showPostBox, setShowPostBox] = useState(false); // 🆕 for popup box
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [connections, setConnections] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const API_URL_CONST = API_URL;

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  const goToSection = (sectionId) => navigate("/main", { state: { scrollTo: sectionId } });

  // Get current user ID from token
  const getCurrentUserId = () => {
    const token = localStorage.getItem("userToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.userId || decoded.id;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  };

  // Fetch user connections
  const fetchConnections = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL_CONST}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnections(res.data.connections || []);
    } catch (err) {
      console.error("Error fetching connections:", err);
    }
  }, []);

  // Fetch all users' thoughts
  const fetchThoughts = useCallback(async () => {
    console.log('🔄 Fetching thoughts...');
    setLoading(true);
    
    try {
      // Try without auth first since we made it public
      const res = await axios.get(`${API_URL_CONST}/api/posts/all-thoughts`);
      console.log('✅ Thoughts response:', res.data);
      const allThoughts = res.data.thoughts || [];
      setThoughts(allThoughts);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching thoughts:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      
      // If public access fails, try with auth token as fallback
      const token = localStorage.getItem("userToken");
      if (token) {
        try {
          const res = await axios.get(`${API_URL_CONST}/api/posts/all-thoughts`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allThoughts = res.data.thoughts || [];
          setThoughts(allThoughts);
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
  }, [navigate]);

  useEffect(() => {
    // Set current user ID
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
    
    // Fetch initial data
    fetchThoughts();
    fetchConnections();
    
    // Remove auto-reload interval - only reload when new thought is created or user manually reloads
  }, [fetchThoughts, fetchConnections]);

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

  const handleLike = (postId) => {
    setThoughts(thoughts.map(post =>
      post._id === postId
        ? { ...post, likes: post.isLiked ? post.likes - 1 : (post.likes || 0) + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  // 🆕 handle creating new thought
  const handleAddThought = async () => {
    if (!content.trim() && !imageFile && !docFile) return;

    const token = localStorage.getItem("userToken");
    const formData = new FormData();
    formData.append("content", content);
    formData.append("type", "thought");
    if (imageFile) formData.append("image", imageFile);
    if (docFile) formData.append("doc", docFile);

    try {
      const res = await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const newThought = res.data.post;
      // Fix image URL construction
      if (newThought.image) {
        if (!newThought.image.startsWith('http')) {
          if (newThought.image.startsWith('/uploads/')) {
            newThought.image = `${API_URL_CONST}${newThought.image}`;
          } else {
            newThought.image = `${API_URL_CONST}/uploads/${newThought.image}`;
          }
        }
      }
      setThoughts((prev) => [newThought, ...prev]);
      setShowPostBox(false);
      setContent('');
      setImageFile(null);
      setDocFile(null);
      if (window.showToast) window.showToast('Thought posted!', 'success');
    } catch (err) {
      console.error("Error creating thought:", err);
      alert("Failed to create thought");
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

  const PostCard = ({ post }) => {
    const authorName = post.user?.name || 'Anonymous';
    const authorId = post.user?._id;
    
    // Check if the post author is the current user
    const isOwnPost = currentUserId && authorId === currentUserId;
    
    // Check if the post author is already connected
    const isConnected = connections.some(connection => 
      connection._id === authorId || connection.user?._id === authorId
    );
    
    // Show Connect button only if it's not own post and not already connected
    const showConnectButton = !isOwnPost && !isConnected;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <ProfilePicture user={post.user} size="w-10 h-10" textSize="text-sm" />
              <div>
                <h3 className="font-semibold text-gray-900">{authorName}</h3>
              </div>
            </div>
            {showConnectButton && (
              <button className="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded hover:bg-yellow-600 transition">
                Connect
              </button>
            )}
          </div>

          <p className="text-gray-700 text-sm leading-relaxed mb-3">{post.content}</p>

          {post.image && (
            <div className="rounded-lg overflow-hidden mb-3">
              <img
                src={(() => {
                  let finalUrl;
                  if (post.image.startsWith("http")) {
                    finalUrl = post.image;
                  } else if (post.image.startsWith("/uploads/")) {
                    finalUrl = `${API_URL}${post.image}`;
                  } else {
                    finalUrl = `${API_URL}/uploads/${post.image}`;
                  }
                  console.log('Groovetalks image URL:', post.image, '->', finalUrl);
                  return finalUrl;
                })()}
                alt="Post content"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  console.log('Image failed to load:', post.image);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-start pt-3 border-t border-gray-100 gap-4">
            <button
              onClick={() => handleLike(post._id)}
              className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition"
            >
              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm font-medium">{post.likes || 0}</span>
            </button>

            <button className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition">
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">{post.shares || 0}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
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
              <button onClick={() => goToSection("explore")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Explore</button>
              <button onClick={() => goToSection("community")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Community</button>
              <button onClick={() => goToSection("resource")} className="text-gray-700 hover:text-amber-600 cursor-pointer">Resources</button>
              <button onClick={() => navigate("/mynetwork")} className="text-gray-700 hover:text-amber-600 cursor-pointer">My Networks</button>
            </div>
            <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
              <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => navigate("/notifications")}>
                <Bell className="w-6 h-6 text-gray-700" />
                {notifications?.some(n => n.unread) && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-1 ring-white"></span>
                )}
              </button>
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pt-24">
        {/* 🆕 Create Post Box */}
        {showPostBox && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full border p-2 rounded mb-3"
            />
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-1 text-gray-600 hover:text-amber-600 cursor-pointer">
                <Image className="w-5 h-5" /> Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
              </label>
              <label className="flex items-center gap-1 text-gray-600 hover:text-amber-600 cursor-pointer">
                <Paperclip className="w-5 h-5" /> File
                <input type="file" className="hidden" onChange={(e) => setDocFile(e.target.files[0])} />
              </label>
              <button onClick={handleAddThought} className="ml-auto bg-amber-500 text-white px-3 py-1 rounded">Post</button>
              <button onClick={() => setShowPostBox(false)} className="bg-gray-300 text-gray-800 px-3 py-1 rounded">Cancel</button>
            </div>
          </div>
        )}

        {/* Thoughts Feed */}
        {loading ? <p>Loading thoughts...</p> :
          thoughts.length > 0 ? thoughts.map(post => <PostCard key={post._id} post={post} />) :
            <p>No thoughts found.</p>
        }
      </main>

      {/* Floating Plus Button */}
      <button
        onClick={() => setShowPostBox(true)}
        className="fixed bottom-8 right-8 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          © 2025 CareGroove. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Groovetalks;
