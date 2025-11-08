import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress ReactQuill findDOMNode warning
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode is deprecated')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
