import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });

  // Fetch user info and set up auth listener
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      console.log("User authentication state changed:", user);
      if (user) {
        fetchUserInfo(user.uid); // Fetch user info only if user is logged in
      } else {
        // If user is logged out, reset currentUser
        fetchUserInfo(null);
      }
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  // Fetch user location
  useEffect(() => {
    const fetchLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(location);
            console.log("User Location Set:", location);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Default location if there's an error
            setUserLocation({ lat: 37.7749, lng: -122.4194 }); // Example: San Francisco
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        // Default location if geolocation is not supported
        setUserLocation({ lat: 37.7749, lng: -122.4194 }); // Example: San Francisco
      }
    };

    fetchLocation();
  }, []);

  // Show loading state while user info is loading
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Route for login page */}
        <Route 
          path="/" 
          element={currentUser ? <Detail currentUser={currentUser} userLocation={userLocation} /> : <Login />} 
        />
        
        {/* Route for /detail page */}
        <Route 
          path="/detail" 
          element={currentUser ? <Detail currentUser={currentUser} userLocation={userLocation} /> : <Login />} 
        />
        
        {/* Other routes */}
        <Route path="/chat" element={chatId ? <Chat /> : <Login />} />
        <Route path="/notification" element={<Notification />} />
      </Routes>
    </Router>
  );
};

export default App;
