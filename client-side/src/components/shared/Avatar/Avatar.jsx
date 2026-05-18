import React from 'react';

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };

const Avatar = ({ src, alt = '', size = 'md', shape = 'circle', className = '' }) => {
  const px = typeof size === 'number' ? size : (SIZE_MAP[size] || 40);
  const radius = shape === 'square' ? 8 : '50%';
  const style = { width: px, height: px, borderRadius: radius, objectFit: 'cover', flexShrink: 0 };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={style}
        className={className}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt || '?')}&background=random&size=${px}`;
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...style,
        background: '#c8d6e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: px * 0.4,
        fontWeight: 600,
        color: '#4a6fa5',
      }}
      className={className}
    >
      {alt ? alt.charAt(0).toUpperCase() : '?'}
    </div>
  );
};

export default Avatar;
