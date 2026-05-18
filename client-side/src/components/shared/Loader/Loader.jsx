import React from 'react';

const Loader = ({ size = 40, className = '' }) => (
  <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <div style={{ width: size, height: size, border: '3px solid #f3f3f3', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Loader;
