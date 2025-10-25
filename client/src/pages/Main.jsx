import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Lightbulb, Heart, Home, Bell, Handshake } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import e1 from "../assets/E1.jpg";
import e2 from "../assets/E2.png";
import e3 from "../assets/E3.jpg";
import e4 from "../assets/E4.png";

import mainimage from "../assets/hero_section.webp";

const MainPage = ({ notifications, setNotifications }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [requestedUsers, setRequestedUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Community states
  const [isCommunityMember, setIsCommunityMember] = useState(false);
  const [communityData, setCommunityData] = useState(null);
  const [isJoiningCommunity, setIsJoiningCommunity] = useState(false);

  const sections = ['hero', 'resources', 'community', 'profiles', 'stories', 'testimonials'];

  const scrollToSection = (index) => {
    const element = document.getElementById(sections[index]);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/");
  };
  
  // Reusable function to refresh user list with connection status
  const refreshUserList = useCallback(async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token || !currentUserId) return;
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get("/api/user/all", config);
      
      if (Array.isArray(data.users)) {
        const availableUsers = data.users.filter(u => u.canConnect === true && u.role !== 'admin');
        const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
        setUsers(shuffled.slice(0, 8));
        
        const requested = data.users.filter(u => u.isRequested).map(u => u._id.toString());
        setRequestedUsers(requested);
      }
    } catch (err) {
      console.error("Error refreshing user list:", err);
    }
  }, [currentUserId]);
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.id?.toString().trim()); // Server uses 'id' not '_id'
    }
  }, []);
  
  // Check community membership status
  useEffect(() => {
    const checkCommunityMembership = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        
        const response = await axios.get("/api/community/membership-status", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setIsCommunityMember(response.data.isMember);
          setCommunityData(response.data.community);
        }
      } catch (error) {
        console.error("Error checking community membership:", error);
      }
    };
    
    if (currentUserId) {
      checkCommunityMembership();
    }
  }, [currentUserId]);
  useEffect(() => {
  const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    refreshUserList();
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [currentUserId, refreshUserList]);


  // Send connection request
  const sendConnectNotification = async (recipientId, recipientName) => {
    if (!currentUserId) return;
    try {
      const token = localStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Use the new connection API endpoint
      await axios.post("/api/connections/request", {
        recipientId: recipientId
      }, config);

      // Refresh user list to update connection status
      await refreshUserList();
      
      setNotifications(prev => [...prev, { 
        id: Date.now(),
        unread: true, 
        message: `Connection request sent to ${recipientName}`,
        time: 'now',
        type: 'general'
      }]);
      if (window.showToast) window.showToast(`Connection request sent to ${recipientName}`, 'success');
    } catch (err) {
      console.error("Error sending connection request:", err.response?.data || err.message);
      if (err.response?.status === 400) {
        alert(err.response.data.message || "Connection request failed");
      }
    }
  };

  // Handle connection acceptance (called from notifications page)
  const handleConnectionAccept = async (connectionId, senderId, senderName) => {
    if (!currentUserId) return;
    try {
      const token = localStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Use the new connection API endpoint
      await axios.put(`/api/connections/accept/${connectionId}`, {}, config);

      // Refresh user list to update connection status
      await refreshUserList();
      
      // Update notifications
      setNotifications(prev => [...prev, {
        id: Date.now(),
        unread: true,
        message: `You are now connected with ${senderName}`,
        time: 'now',
        type: 'general'
      }]);
      if (window.showToast) window.showToast(`Connected with ${senderName}`, 'success');
    } catch (err) {
      console.error("Error accepting connection:", err.response?.data || err.message);
    }
  };

  // Expose this function globally so Notifications page can use it
  window.handleConnectionAccept = handleConnectionAccept;
  
  // Handle joining community
  const handleJoinCommunity = async () => {
    if (isCommunityMember || isJoiningCommunity) return;
    
    try {
      setIsJoiningCommunity(true);
      const token = localStorage.getItem("userToken");
      
      const response = await axios.post("/api/community/join", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setIsCommunityMember(true);
        setCommunityData(response.data.community);
        
        // Add success notification to state
        setNotifications(prev => [...prev, {
          id: Date.now(),
          unread: true,
          message: "Welcome to CareGroove Community! You've successfully joined our supportive community.",
          time: 'now',
          type: 'general'
        }]);
        if (window.showToast) window.showToast("Welcome to the community!", 'success');
      }
    } catch (error) {
      console.error("Error joining community:", error);
      if (error.response?.data?.message === "You are already a member of the community") {
        setIsCommunityMember(true);
        alert("You are already a member of the community!");
      } else {
        alert("Failed to join community. Please try again.");
      }
    } finally {
      setIsJoiningCommunity(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md fixed w-full top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CareGroove</span>
            </div>

            {/* Menu */}
            <div className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection(0)} className="text-gray-700 hover:text-amber-600 transition-colors">Home</button>
              <button onClick={() => scrollToSection(1)} className="text-gray-700 hover:text-amber-600 transition-colors">Explore</button>
              <button onClick={() => scrollToSection(2)} className="text-gray-700 hover:text-amber-600 transition-colors">Community</button>
              <button onClick={() => scrollToSection(3)} className="text-gray-700 hover:text-amber-600 transition-colors">Resources</button>
              <button 
                onClick={() => navigate("/mynetwork")}
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                My Networks
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('footer');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                About Us
              </button>
            </div>

            {/* Notification + Profile */}
            <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
              <div className="relative">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {notifications?.some(n => n.unread) && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-1 ring-white"></span>
                  )}
                </button>
              </div>
              <div className="relative">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition"
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
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <section id="hero" className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                A Place for Single Parents to Connect, Grow, and Thrive.
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Parenting isn't meant to be a solo journey. Here, you'll find connection, encouragement, and people who truly understand.
              </p>
              {!isCommunityMember ? (
                <button 
                  onClick={handleJoinCommunity}
                  disabled={isJoiningCommunity}
                  className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                    isJoiningCommunity 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {isJoiningCommunity ? 'Joining...' : 'Join Our Community'}
                </button>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-lg border border-green-200 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">You're a Community Member!</span>
                  </div>
                  {communityData && (
                    <p className="text-gray-600 text-sm">
                      Part of a community with {communityData.memberCount} members
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl p-8 shadow-2xl">
                <img
                  src={mainimage}
                  alt="Mother and child"
                  className="w-full h-80 object-cover rounded-2xl shadow-lg"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
                <Heart className="w-12 h-12 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Resources Section */}
      <section id="resources" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Our GrowConnect</h2>
            <p className="text-xl text-gray-600">Discover a variety of resources designed to support single parents.</p>
          </div>
         
          {/* Resource Boxes */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <div onClick={() => navigate("/groovetalks")} className="cursor-pointer text-center p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">GrooveTalks</h3>
              <p className="text-gray-600">Join live hangouts and gain insight to make your day.</p>
            </div>

            <div onClick={() => { navigate("/jobhive"); window.scrollTo(0, 0); }} className="cursor-pointer text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">JobHive</h3>
              <p className="text-gray-600">Empowering single parents with new job opportunities.</p>
            </div>

            <div onClick={() => { navigate("/hughand"); window.scrollTo(0, 0); }} className="cursor-pointer text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Handshake className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hug & Hand</h3>
              <p className="text-gray-600">A helping hand to lean on every single parent's need.</p>
            </div>
          </div>

          <div className="flex justify-center gap-8">
            <div onClick={() => navigate("/fundnest")} className="cursor-pointer w-full md:w-1/2 lg:w-1/3 text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">FundNest</h3>
              <p className="text-gray-600">Find financial help for your family and children.</p>
            </div>

            <div onClick={() => navigate("/daycare")} className="cursor-pointer w-full md:w-1/2 lg:w-1/3 text-center p-8 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">DayCare</h3>
              <p className="text-gray-600">Trusted care for your little ones so you can focus.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Join Our Community Forum</h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Where strength meets community, and every journey is celebrated. Connect with parents who understand, share experiences, and grow stronger together.
          </p>

          <div className="flex justify-center mb-8">
            <div className="flex -space-x-4">
              <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face" className="w-16 h-16 rounded-full border-4 border-white shadow-lg" alt="Community member" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" className="w-16 h-16 rounded-full border-4 border-white shadow-lg" alt="Community member" />
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" className="w-16 h-16 rounded-full border-4 border-white shadow-lg" alt="Community member" />
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" className="w-16 h-16 rounded-full border-4 border-white shadow-lg" alt="Community member" />
              <img src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=80&h=80&fit=crop&crop=face" className="w-16 h-16 rounded-full border-4 border-white shadow-lg" alt="Community member" />
            </div>
          </div>

          <button 
            onClick={() => navigate("/community")}
            className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-lg transform hover:-translate-y-1 border border-gray-200"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Suggested Profiles Section */}
      <section id="profiles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Suggested Profiles for You</h2>
            <p className="text-xl text-gray-600">
              Connect with other parents who share similar interests and journeys.
            </p>
          </div>

          {users.length > 0 ? (
            <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide snap-x snap-mandatory">
              {users.map(user => (
                <div
                  key={user._id}
                  className="min-w-[260px] max-w-[260px] snap-center flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
                >
                  {/* Profile Picture */}
                  <div className="flex justify-center mb-3">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        className="w-16 h-16 rounded-full border-2 border-white shadow-lg object-cover"
                        alt={user.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          const fallback = document.createElement('div');
                          fallback.className = 'w-16 h-16 rounded-full border-2 border-white shadow-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center';
                          fallback.innerHTML = `<span class="text-white text-xl font-bold">${user.name[0].toUpperCase()}</span>`;
                          parent.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-white shadow-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">{user.name[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Name and Details */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{user.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {user.bio || "No bio yet."}
                    </p>
                    <button
                      disabled={requestedUsers.includes(user._id)}
                      onClick={() => sendConnectNotification(user._id, user.name)}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors text-white ${
                        requestedUsers.includes(user._id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-amber-500 hover:bg-amber-600"
                      }`}
                    >
                      {requestedUsers.includes(user._id) ? "Requested" : "Connect"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No users found.</p>
          )}
        </div>
      </section>



      {/* Empowering Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4">
              <img src={e1} className="rounded-xl shadow-md" alt="Event 1" />
              <img src={e2} className="rounded-xl shadow-md" alt="Event 2" />
              <img src={e4} className="rounded-xl shadow-md" alt="Event 4" />
              <img src={e3} className="rounded-xl shadow-md" alt="Event 3" />
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Empowering Single Parents</h2>
              <p className="text-gray-700 leading-relaxed">
                A safe space built for single parents — our community-focused platform brings parents together to share, connect, and grow stronger. From emotional support to practical resources, we help you navigate the unique challenges where no single parent ever feels alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">CareGroove</span>
              </div>
              <p className="text-gray-400">Empowering single parents to connect, grow, and thrive together in a supportive community.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate("/groovetalks")} className="hover:text-white transition-colors text-left">GrooveTalks</button></li>
                <li><button onClick={() => navigate("/jobhive")} className="hover:text-white transition-colors text-left">JobHive</button></li>
                <li><button onClick={() => navigate("/fundnest")} className="hover:text-white transition-colors text-left">FundNest</button></li>
                <li><button onClick={() => navigate("/daycare")} className="hover:text-white transition-colors text-left">DayCare</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate("/community")} className="hover:text-white transition-colors text-left">Support Circles</button></li>
                <li><button onClick={() => navigate("/community")} className="hover:text-white transition-colors text-left">Forums</button></li>
                <li><button onClick={() => navigate("/groovetalks")} className="hover:text-white transition-colors text-left">Stories</button></li>
                <li><button onClick={() => navigate("/community")} className="hover:text-white transition-colors text-left">Events</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => alert("Help Center - Coming Soon!")} className="hover:text-white transition-colors text-left">Help Center</button></li>
                <li><button onClick={() => alert("Contact Us - Coming Soon!")} className="hover:text-white transition-colors text-left">Contact Us</button></li>
                <li><button onClick={() => alert("Privacy Policy - Coming Soon!")} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => alert("Terms of Service - Coming Soon!")} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CareGroove. All rights reserved. Made with ❤️ for single parents everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;
