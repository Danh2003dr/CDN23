import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, useTheme, Tooltip, Fade } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
      <LanguageIcon 
        sx={{ 
          fontSize: '1rem', 
          color: theme.palette.text.secondary,
          mr: 1 
        }} 
      />
      <Tooltip 
        title={t('Switch Language')} 
        TransitionComponent={Fade}
        placement="bottom"
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            variant={currentLanguage === 'en' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => changeLanguage('en')}
            sx={{
              minWidth: 40,
              height: 32,
              fontSize: '0.75rem',
              fontWeight: currentLanguage === 'en' ? 600 : 400,
              textTransform: 'none',
              borderRadius: 2,
              borderColor: theme.palette.primary.main,
              color: currentLanguage === 'en' ? 'white' : theme.palette.primary.main,
              backgroundColor: currentLanguage === 'en' ? theme.palette.primary.main : 'transparent',
              '&:hover': {
                backgroundColor: currentLanguage === 'en' ? theme.palette.primary.dark : 'rgba(25, 118, 210, 0.04)',
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[2],
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            EN
          </Button>
          <Button
            variant={currentLanguage === 'vi' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => changeLanguage('vi')}
            sx={{
              minWidth: 40,
              height: 32,
              fontSize: '0.75rem',
              fontWeight: currentLanguage === 'vi' ? 600 : 400,
              textTransform: 'none',
              borderRadius: 2,
              borderColor: theme.palette.primary.main,
              color: currentLanguage === 'vi' ? 'white' : theme.palette.primary.main,
              backgroundColor: currentLanguage === 'vi' ? theme.palette.primary.main : 'transparent',
              '&:hover': {
                backgroundColor: currentLanguage === 'vi' ? theme.palette.primary.dark : 'rgba(25, 118, 210, 0.04)',
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[2],
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            VI
          </Button>
        </Box>
      </Tooltip>
    </Box>
  );
};

export default LanguageSwitcher; 