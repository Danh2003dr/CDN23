import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: sizeMap[size],
          height: sizeMap[size],
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent, ${alpha('#667eea', 0.8)}, transparent)`,
            animation: 'spin 1s linear infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: sizeMap[size] * 0.7,
            height: sizeMap[size] * 0.7,
            borderRadius: '50%',
            background: 'white',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
          },
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontWeight: 500,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha('#667eea', 0.8)} 0%, ${alpha('#764ba2', 0.8)} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner; 