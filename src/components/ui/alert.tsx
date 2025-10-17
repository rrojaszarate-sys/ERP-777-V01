import React from 'react';

interface AlertProps {
  className?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ className = '', children }) => {
  return (
    <div className={`rounded-lg border p-4 ${className}`} role="alert">
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ className = '', children }) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};
