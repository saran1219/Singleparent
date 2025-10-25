import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MainPage from "./pages/Main";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Groovetalks from "./pages/Groovetalks";
import FundNest from "./pages/FundNest";
import Hughand from "./pages/Hughand";
import Jobhive from "./pages/Jobhive";
import Daycare from "./pages/Daycare";
import Community from "./pages/community";
import Addcaregiver from "./pages/Addcaregivers";
import MyNetwork from "./pages/MyNetwork";
import ToastContainer from "./components/Toast";
function App() {
  // ✅ Shared notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "connections",
      title: "Connection Request",
      subtitle: "Sarah L. wants to connect with you.",
      time: "2m ago",
      unread: true,
      hasAction: true,
    },
    {
      id: 2,
      type: "likes",
      title: "Someone liked your post",
      subtitle: "Mark S. liked your parenting story.",
      time: "10m ago",
      unread: true,
    },
    {
      id: 3,
      type: "comments",
      title: "New Comment",
      subtitle: "Jessica A. commented: 'This really helped me!'",
      time: "30m ago",
      unread: false,
    },
    {
      id: 4,
      type: "posts",
      title: "New Post",
      subtitle: "Tom K. posted a new post.",
      time: "1h ago",
      unread: true,
    },
  ]);

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* ✅ Pass notifications state as props */}
        <Route 
          path="/main" 
          element={<MainPage notifications={notifications} setNotifications={setNotifications} />} 
        />
        <Route 
          path="/profile" 
          element={<Profile notifications={notifications} setNotifications={setNotifications} />} 
        />
        <Route 
          path="/profile/:userId" 
          element={<Profile notifications={notifications} setNotifications={setNotifications} />} 
        />
        <Route 
          path="/notifications" 
          element={<Notifications notifications={notifications} setNotifications={setNotifications} />} 
        />
        <Route path="/groovetalks" element={<Groovetalks />} />
        <Route path="/fundnest" element={<FundNest />} />
        <Route 
          path="/hughand" 
          element={<Hughand notifications={notifications} setNotifications={setNotifications} />} 
        />
        <Route path="/jobhive" element={<Jobhive />} />
        <Route path="/daycare" element={<Daycare />} />
        <Route path="/community" element={<Community />} />
        <Route path="/addcaregiver" element={<Addcaregiver />}/>
        <Route path="/mynetwork" element={<MyNetwork />}/>
      </Routes>
    </Router>
  );
}

export default App;