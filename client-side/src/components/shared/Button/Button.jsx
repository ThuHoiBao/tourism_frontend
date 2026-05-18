import React from 'react';

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button', ...rest }) => {
  const base = { cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', borderRadius: 8, fontWeight: 500, transition: 'all 0.2s', opacity: disabled ? 0.6 : 1 };
  const variants = {
    primary: { background: '#1a73e8', color: '#fff', padding: size === 'sm' ? '6px 14px' : '10px 20px' },
    secondary: { background: '#f1f3f4', color: '#333', padding: size === 'sm' ? '6px 14px' : '10px 20px' },
    danger: { background: '#ea4335', color: '#fff', padding: size === 'sm' ? '6px 14px' : '10px 20px' },
    ghost: { background: 'transparent', color: '#1a73e8', padding: size === 'sm' ? '6px 14px' : '10px 20px' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...(variants[variant] || variants.primary) }} className={className} {...rest}>
      {children}
    </button>
  );
};

export default Button;
