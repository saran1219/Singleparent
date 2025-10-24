import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  Plus,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const CommunityDashboard = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications] = useState([{ unread: true }]);
  const [selectedDate, setSelectedDate] = useState(7);
  const [message, setMessage] = useState('');
  
  // Database states
  const [communityMembers, setCommunityMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCommunityMember, setIsCommunityMember] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  
  // Create event form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState('Community');
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showDateEvents, setShowDateEvents] = useState(false);
  const [dateEvents, setDateEvents] = useState([]);
  const [selectedDateInfo, setSelectedDateInfo] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/');
  };
  
  // Backend URL
  const API_URL_CONST = API_URL;
  
  // Get profile image URL
  const getProfileImageUrl = (profilePic, userName = 'User') => {
    if (!profilePic || profilePic === '') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=f59e0b&color=ffffff&size=150`;
    }
    if (profilePic.startsWith('http')) return profilePic;
    
    // Handle both old format (/uploads/filename) and new format (filename)
    if (profilePic.startsWith('/uploads/')) {
      return `${API_URL_CONST}${profilePic}`;
    }
    return `${API_URL_CONST}/uploads/${profilePic}`;
  };
  
  // Join community function
  const handleJoinCommunity = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.post("/api/community/join", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert("Welcome to the community! You can now access all community features.");
        setIsCommunityMember(true);
        // Refresh the page to load community data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error joining community:", error);
      alert("Failed to join community. Please try again.");
    }
  };

  // Fetch current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        
        const response = await axios.get("/api/user/profile", {
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
  
  // Check community membership and fetch data
  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) {
          navigate("/login");
          return;
        }
        
        setLoading(true);
        
        // Check membership status first
        const membershipResponse = await axios.get("/api/community/membership-status", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setIsCommunityMember(membershipResponse.data.isMember);
        
        if (membershipResponse.data.isMember) {
          // Fetch all community data in parallel
          const [membersResponse, eventsResponse, chatResponse] = await Promise.all([
            axios.get("/api/community/members", {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get("/api/community/events", {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get("/api/community/chat", {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          
          setCommunityMembers(membersResponse.data.members || []);
          setEvents(eventsResponse.data.events || []);
          setChatMessages(chatResponse.data.messages || []);
        }
        
      } catch (error) {
        console.error("Error fetching community data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("userToken");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityData();
  }, [navigate]);
  
  // Send chat message
  const handleSendMessage = async () => {
    if (!message.trim() || !isCommunityMember) return;
    
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.post("/api/community/chat", 
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Add new message to chat
        const newMessage = response.data.chat;
        const formattedMessage = {
          id: newMessage._id,
          message: newMessage.message,
          sender: {
            id: newMessage.sender._id,
            name: newMessage.sender.name,
            profilePic: newMessage.sender.profilePic
          },
          time: newMessage.formattedTime,
          createdAt: newMessage.createdAt
        };
        
        setChatMessages(prev => [...prev, formattedMessage]);
        setMessage('');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };
  
  // Create event
  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime || !isCommunityMember) {
      alert("Please fill in all required fields");
      return;
    }
    
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.post("/api/community/events", {
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        type: eventType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Add new event to list
        const newEvent = response.data.event;
        const formattedEvent = {
          _id: newEvent._id,
          title: newEvent.title,
          description: newEvent.description,
          date: new Date(newEvent.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          time: newEvent.time,
          location: newEvent.location,
          type: newEvent.type
        };
        
        setEvents(prev => [formattedEvent, ...prev]);
        
        // Reset form
        setEventTitle('');
        setEventDescription('');
        setEventDate('');
        setEventTime('');
        setEventLocation('');
        setEventType('Community');
        setShowCreateEvent(false);
        
        alert("Event created successfully! All community members have been notified.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    }
  };
  
  // Handle Enter key for chat
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Delete chat message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.delete(`/api/community/chat/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Remove message from UI
        setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
        setContextMenu(null);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert(error.response?.data?.message || "Failed to delete message");
    }
  };
  
  // Handle right-click on chat message
  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    
    // Only show context menu if user is the sender
    if (currentUser && chat.sender.id === currentUser._id) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        messageId: chat.id
      });
    }
  };
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);
  
  // Handle calendar date click
  const handleDateClick = async (day) => {
    if (!day || !isCommunityMember) return;
    
    setSelectedDate(day);
    
    try {
      const token = localStorage.getItem("userToken");
      const currentYear = 2025;
      const currentMonth = 10; // October is month 10 (1-indexed for display)
      
      // Create date string in YYYY-MM-DD format without timezone issues
      const month = currentMonth.toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const dateString = `${currentYear}-${month}-${dayStr}`;
      
      const response = await axios.get(`/api/community/events/date/${dateString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDateEvents(response.data.events);
        setSelectedDateInfo(response.data.date);
        setShowDateEvents(true);
      }
    } catch (error) {
      console.error("Error fetching events for date:", error);
      // Still show the modal even if there's an error, but with no events
      setDateEvents([]);
      setSelectedDateInfo(`Events for October ${day}, 2025`);
      setShowDateEvents(true);
    }
  };

  const daysInMonth = [
    [null, 1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
    [28, 29, 30, 31, null, null, null],
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }
  
  // Show non-member message
  if (!isCommunityMember) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => navigate('/main')}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center">
                <Heart className="text-white w-4 h-4" />
              </div>
              <span className="text-xl text-gray-800 font-bold">
                Care<span className="text-gray-800 font-bold">Groove</span>
              </span>
            </div>

            {/* Nav + Icons */}
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
            
            {/* Notification + Profile */}
            <div className="flex items-center gap-4">
              <button
                className="p-2 rounded-full hover:bg-gray-100 relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {notifications?.some((n) => n.unread) && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-1 ring-white"></span>
                )}
              </button>
              <div className="relative" ref={dropdownRef}>
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
                        navigate('/profile');
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
        </header>
        
        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-sm">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Welcome to CareGroove Community! Connect with other single parents, participate in events, 
              share experiences through chat, and access exclusive community features.
            </p>
            <div className="space-y-4">
              <button 
                onClick={handleJoinCommunity}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
              >
                Join Community Now
              </button>
              <button 
                onClick={() => navigate('/main')}
                className="w-full border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Go to Main Page
              </button>
            </div>
            
            {/* Community Benefits */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Benefits</h3>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Connect with other single parents</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Join community events and meetups</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Participate in community chat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Access exclusive member features</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => navigate('/main')}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center">
              <Heart className="text-white w-4 h-4" />
            </div>
            <span className="text-xl text-gray-800 font-bold">
              Care<span className="text-gray-800 font-bold">Groove</span>
            </span>
          </div>

          {/* Nav + Icons */}
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
            <div>

            {/* Notification + Profile together */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                className="p-2 rounded-full hover:bg-gray-100 relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {notifications?.some((n) => n.unread) && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-1 ring-white"></span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
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
                        navigate('/profile');
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar + Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">October 2025</h2>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-600 py-0.5">
                    {day.slice(0, 2)}
                  </div>
                ))}
                {daysInMonth.flat().map((day, idx) => (
                  <div key={idx} className="aspect-square flex items-center justify-center p-0.5">
                    {day && (
                      <button
                        onClick={() => handleDateClick(day)}
                        className={`w-full h-full flex items-center justify-center rounded text-xs font-medium transition-colors ${
                          selectedDate === day
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
                <button 
                  onClick={() => setShowCreateEvent(true)}
                  className="flex items-center gap-2 text-orange-500 text-sm font-medium hover:text-orange-600"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              </div>
              
              {/* Create Event Form */}
              {showCreateEvent && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Event</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Event Title *"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <textarea
                      placeholder="Event Description"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Location (optional)"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="Community">Community</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Online Meetup">Online Meetup</option>
                      <option value="Local Meetup">Local Meetup</option>
                      <option value="Webinar">Webinar</option>
                      <option value="Wellness">Wellness</option>
                      <option value="Reading">Reading</option>
                    </select>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleCreateEvent}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
                      >
                        Create Event
                      </button>
                      <button 
                        onClick={() => setShowCreateEvent(false)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.map((event, idx) => (
                    <div
                      key={event._id || idx}
                      className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {event.date}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full ml-3">
                        {event.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming events. Create the first one!</p>
                )}
              </div>
            </div>
          </div>

          {/* Members + Chat */}
          <div className="lg:col-span-3 space-y-6">
            {/* Members */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Community Members</h2>
                <button 
                  onClick={() => setShowAllMembers(true)}
                  className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {communityMembers.length > 0 ? (
                  communityMembers.slice(0, 6).map((member) => (
                    <div key={member.user._id} className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full overflow-hidden mb-1">
                        <img
                          src={getProfileImageUrl(member.user.profilePic, member.user.name)}
                          alt={member.user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=f59e0b&color=ffffff&size=120`;
                          }}
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-0.5 text-xs truncate w-full text-center">{member.user.name}</h3>
                      <button 
                        onClick={() => navigate(`/profile/${member.user._id}`)}
                        className="text-orange-500 text-xs hover:text-orange-600"
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500">No community members found.</p>
                  </div>
                )}
              </div>
              {communityMembers.length > 6 && (
                <div className="text-center mt-3">
                  <p className="text-xs text-gray-600">
                    Showing 6 of {communityMembers.length} members
                  </p>
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Community Chat</h2>
              </div>

              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {chatMessages.length > 0 ? (
                  chatMessages.map((chat) => (
                    <div 
                      key={chat.id} 
                      className="flex gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                      onContextMenu={(e) => handleContextMenu(e, chat)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={getProfileImageUrl(chat.sender.profilePic, chat.sender.name)} 
                          alt={chat.sender.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.sender.name)}&background=f59e0b&color=ffffff&size=40`;
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{chat.sender.name}</span>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                          {chat.isEdited && (
                            <span className="text-xs text-gray-400 italic">(edited)</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{chat.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={isCommunityMember ? "Type your message..." : "Join community to chat"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isCommunityMember}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!isCommunityMember || !message.trim()}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          © 2025 CareGroove. All rights reserved.
        </div>
      </footer>
      
      {/* View All Members Modal */}
      {showAllMembers && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAllMembers(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Community Members</h2>
                  <p className="text-gray-600 mt-1">{communityMembers.length} total members</p>
                </div>
                <button
                  onClick={() => setShowAllMembers(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {communityMembers.map((member) => (
                  <div key={member.user._id} className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-gray-200">
                      <img
                        src={getProfileImageUrl(member.user.profilePic, member.user.name)}
                        alt={member.user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=f59e0b&color=ffffff&size=150`;
                        }}
                      />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{member.user.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Joined {new Date(member.joinedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-orange-600 font-medium mb-3 capitalize">
                      {member.role}
                    </p>
                    <button 
                      onClick={() => {
                        setShowAllMembers(false);
                        navigate(`/profile/${member.user._id}`);
                      }}
                      className="text-orange-500 text-sm hover:text-orange-600 font-medium"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
              
              {communityMembers.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
                  <p className="text-gray-600">Be the first to join this community!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Date Events Modal */}
      {showDateEvents && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDateEvents(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Events</h2>
                  <p className="text-gray-600 mt-1">{selectedDateInfo}</p>
                </div>
                <button
                  onClick={() => setShowDateEvents(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {dateEvents.length > 0 ? (
                <div className="space-y-4">
                  {dateEvents.map((event) => (
                    <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <img
                              src={getProfileImageUrl(event.organizer.profilePic, event.organizer.name)}
                              alt={event.organizer.name}
                              className="w-5 h-5 rounded-full"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer.name)}&background=f59e0b&color=ffffff&size=20`;
                              }}
                            />
                            <span>Organized by {event.organizer.name}</span>
                            {event.attendeesCount > 0 && (
                              <span>• {event.attendeesCount} attending</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full ml-3">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Events</h3>
                  <p className="text-gray-600 mb-4">No events scheduled for this date.</p>
                  <button
                    onClick={() => {
                      setShowDateEvents(false);
                      setShowCreateEvent(true);
                    }}
                    className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                  >
                    Create an Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Context Menu for Chat Delete */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
            Delete Message
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityDashboard;
