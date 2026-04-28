import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import reportWebVitals from './reportWebVitals.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
const GOOGLE_CLIENT_ID = "365652132286-l3248dr6g4ekvur1mn1ua4fvduusavqc.apps.googleusercontent.com";


const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement); // Tạo root mới với createRoot


root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

