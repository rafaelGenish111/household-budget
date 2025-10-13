import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UpdateToast from './components/layout/UpdateToast.jsx';
import InstallPrompt from './components/layout/InstallPrompt.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
        <UpdateToast />
        <InstallPrompt />
    </React.StrictMode>
);

