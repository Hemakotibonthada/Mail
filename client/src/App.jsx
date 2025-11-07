import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { useAuthStore } from './store/authStore';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Compose from './pages/Compose';
import EmailView from './pages/EmailView';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [setUser]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/inbox" replace />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="sent" element={<Inbox folder="sent" />} />
            <Route path="drafts" element={<Inbox folder="drafts" />} />
            <Route path="trash" element={<Inbox folder="trash" />} />
            <Route path="spam" element={<Inbox folder="spam" />} />
            <Route path="compose" element={<Compose />} />
            <Route path="email/:id" element={<EmailView />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
