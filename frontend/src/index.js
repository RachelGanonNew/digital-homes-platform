import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'process/browser';
import { Buffer } from 'buffer';

// Polyfills for Node globals in browser (needed by CosmJS under CRA v5)
window.global = window;
window.Buffer = window.Buffer || Buffer;
window.process = window.process || require('process/browser');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
