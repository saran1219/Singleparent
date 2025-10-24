import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Heart, Mail, MapPin, Calendar, ArrowLeft, UserMinus, Users } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";

const MyNetwork = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("/api/connections/my-connections", config);
      
      setConnections(response.data.connections || []);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(conn => {
    if (filter === "recent") {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(conn.connectionDate) > oneWeekAgo;
    }
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleRemoveConnection = async (connectionId, userName) => {
    if (!window.confirm(`Are you sure you want to disconnect from ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`/api/connections/remove/${connectionId}`, config);
      
      // Refresh the connections list
      await fetchConnections();
      
      alert(`Successfully disconnected from ${userName}`);
    } catch (err) {
      console.error("Error removing connection:", err);
      alert("Failed to remove connection. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/main")}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Network</h1>
                <p className="text-gray-600">
                  {connections.length} {connections.length === 1 ? "connection" : "connections"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CareGroove</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Filter:</span>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Connections
            </button>
            <button
              onClick={() => setFilter("recent")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "recent"
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Recent (7 days)
            </button>
          </div>
        </div>

        {/* Connections Grid */}
        {filteredConnections.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === "recent" ? "No Recent Connections" : "No Connections Yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === "recent" 
                ? "You haven't made any connections in the past week."
                : "Start connecting with other parents to build your network!"
              }
            </p>
            <button
              onClick={() => navigate("/main")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Suggestions
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredConnections.map((connection) => (
              <div
                key={connection._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Compact Profile Card */}
                <div className="p-4 text-center">
                  {/* Profile Picture */}
                  <div className="relative inline-block mb-3">
                    <img
                      src={
                        connection.profilePic && connection.profilePic.startsWith('/')
                          ? `${API_URL}${connection.profilePic}`
                          : connection.profilePic || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.name || 'User')}&background=f59e0b&color=ffffff&size=80`
                      }
                      alt={connection.name}
                      className="w-16 h-16 rounded-full border-2 border-amber-200 shadow-sm object-cover"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                    {connection.name || "Unknown User"}
                  </h3>
                  
                  {/* Essential Info */}
                  <div className="space-y-2 mb-3">
                    {connection.email && (
                      <div className="flex items-center text-gray-600 text-xs">
                        <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{connection.email}</span>
                      </div>
                    )}
                    
                    {connection.location && (
                      <div className="flex items-center text-gray-600 text-xs">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{connection.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-600 text-xs">
                      <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {formatDate(connection.connectionDate)}
                      </span>
                    </div>
                  </div>

                  {/* Compact Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center"
                      onClick={() => {
                        navigate(`/profile/${connection._id}`);
                      }}
                      title="View Profile"
                    >
                      <User className="w-3 h-3" />
                    </button>
                    <button 
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center"
                      onClick={() => handleRemoveConnection(connection.connectionId, connection.name)}
                      title="Disconnect"
                    >
                      <UserMinus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {connections.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-amber-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Network Stats</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
                <div className="text-gray-600">Total Connections</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.thisWeek}</div>
                <div className="text-gray-600">This Week</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
                <div className="text-3xl font-bold text-amber-600 mb-2">{stats.thisMonth}</div>
                <div className="text-gray-600">This Month</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyNetwork;