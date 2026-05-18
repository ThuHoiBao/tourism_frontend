import React from 'react';

const Badge = ({ children, color, className = '', style = {} }) => {
  const bg = color || '#e8f4fd';
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: bg, color: '#333', ...style }} className={className}>
      {children}
    </span>
  );
};

export default Badge;
