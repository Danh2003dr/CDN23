import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Language as LanguageIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { } = useTranslation();
  const theme = useTheme();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (languageCode: string) => {
    changeLanguage(languageCode);
    handleClose();
  };

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <LanguageIcon 
        sx={{ 
          fontSize: '1rem', 
          color: theme.palette.text.secondary,
          mr: 1 
        }} 
      />
      <Button
        onClick={handleClick}
        variant="outlined"
        size="small"
        endIcon={<ExpandMoreIcon />}
        sx={{
          minWidth: 120,
          height: 32,
          fontSize: '0.75rem',
          fontWeight: 500,
          textTransform: 'none',
          borderRadius: 2,
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            borderColor: theme.palette.primary.dark,
          },
        }}
      >
        {currentLang?.nativeName || currentLanguage.toUpperCase()}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 150,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
        {availableLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            selected={currentLanguage === language.code}
            sx={{
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LanguageIcon 
                sx={{ 
                  fontSize: '1rem',
                  color: currentLanguage === language.code ? theme.palette.primary.main : theme.palette.text.secondary,
                }} 
              />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" sx={{ fontWeight: currentLanguage === language.code ? 600 : 400 }}>
                {language.nativeName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {language.name}
              </Typography>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSelector; 