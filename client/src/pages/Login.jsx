import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode"; // fixed import
import { Heart} from 'lucide-react';
import googleIcon from "../assets/google-icon.png";
import illustration from "../assets/login-illustration.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post("/api/auth/login", { email, password });

      if (response.data.success) {
  // ✅ Store JWT token and user details
  localStorage.setItem("userToken", response.data.token);
  localStorage.setItem("userRole", response.data.user.role);
  localStorage.setItem("userEmail", response.data.user.email);
  localStorage.setItem("userName", response.data.user.name);
  localStorage.setItem("userId", response.data.user.id);
  setMessage("✅ Login successful!");

  // redirect based on role (optional)
  if (response.data.user.role === "admin") {
    navigate("/main"); // you can make a special admin dashboard route if you want
  } else {
    navigate("/main"); // normal users go to main page
  }
}
 else {
        setMessage("❌ Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error logging in");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google login success:', tokenResponse);
      try {
        // For OAuth2 flow, we get an access_token, not a JWT credential
        // We need to fetch user info from Google API
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`,
          },
        });
        
        const userInfo = await response.json();
        console.log('Google user info:', userInfo);
        
        // Store user information
        localStorage.setItem("userToken", tokenResponse.access_token);
        localStorage.setItem("userName", userInfo.name);
        localStorage.setItem("userEmail", userInfo.email);
        localStorage.setItem("userId", userInfo.id);
        localStorage.setItem("userRole", "user"); // default role
        
        setMessage(`✅ Welcome ${userInfo.name}!`);
        
        // Send user info to backend and get JWT token
        try {
          const backendResponse = await axios.post('/api/auth/google-login', {
            googleId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture
          });
          
          if (backendResponse.data.success) {
            // Replace Google access token with our backend JWT token
            localStorage.setItem("userToken", backendResponse.data.token);
            localStorage.setItem("userName", backendResponse.data.user.name);
            localStorage.setItem("userEmail", backendResponse.data.user.email);
            localStorage.setItem("userId", backendResponse.data.user.id);
            localStorage.setItem("userRole", backendResponse.data.user.role);
            
            console.log('Backend Google login successful');
          }
        } catch (backendError) {
          console.error('Backend Google login failed:', backendError);
          setMessage("❌ Google login failed - server error");
          return;
        }
        
        navigate("/main");
      } catch (error) {
        console.error("Google Login Error:", error);
        setMessage("❌ Google login failed - please try again");
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setMessage("❌ Google login failed - please check your connection");
    },
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-[60%] flex items-center justify-center bg-white py-10">
        <img src={illustration} alt="Login Illustration" className="w-[80%] max-w-sm md:max-w-[75%] object-contain" />
      </div>
    <div className="absolute top-4 right-4 sm:right-6 md:right-8 flex space-x-4 sm:space-x-6 text-sm sm:text-base md:text-lg font-semibold text-[#A07627] z-10">
      <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-700">CareGroove</span>
        </div>
      </div>
      <div className="w-full md:w-[40%] bg-[#fcd385] flex flex-col justify-center px-6 sm:px-12 py-10">
        <h2 className="text-2xl italic text-[#805300] mb-8 text-center">Welcome</h2>

        <form onSubmit={handleLogin}>
          <div className="flex items-center bg-white rounded-md px-3 py-2 mb-4">
            <FaEnvelope className="text-gray-500 mr-2" />
            <input
              type="email"
              placeholder="Email"
              className="w-full outline-none bg-transparent text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center bg-white rounded-md px-3 py-2 mb-6">
            <FaLock className="text-gray-500 mr-2" />
            <input
              type="password"
              placeholder="Password"
              className="w-full outline-none bg-transparent text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="bg-[#ecb129] text-white font-semibold py-2 rounded-md mb-4 w-full hover:bg-[#d8a419]">
            Log In
          </button>
        </form>

        {message && <p className="text-center text-sm text-red-700 italic mb-3">{message}</p>}

        <Link to="/register">
          <button className="bg-white text-[#ecb129] font-semibold border border-[#ecb129] py-2 rounded-md mb-4 w-full hover:bg-[#fff4dc]">
            Register
          </button>
        </Link>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-600" />
          <span className="mx-2 text-sm text-gray-700">or</span>
          <hr className="flex-grow border-gray-600" />
        </div>

        <button
          onClick={() => googleLogin()}
          className="bg-white border py-2 rounded-md flex justify-center items-center gap-2 mb-4 w-full hover:bg-[#f4f4f4]"
        >
          <img src={googleIcon} alt="Google" className="w-5 h-5" />
          <span className="font-semibold text-sm">Sign in with Google</span>
        </button>

        <p className="text-sm text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="italic underline text-[#805300]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
