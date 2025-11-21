import React from 'react';
import { clsx } from 'clsx';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  const baseStyles = 'px-4 py-2 font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200';

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed';

  const classes = clsx(
    baseStyles,
    variantStyles[variant],
    disabled && disabledStyles,
    className
  );

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
