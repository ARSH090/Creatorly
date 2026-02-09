'use client';
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setVisible(consent !== 'yes');
  }, []);
  const accept = () => {
    document.cookie = `cookie_consent=1; path=/; SameSite=Lax`;
    localStorage.setItem('cookie-consent', 'yes');
    setVisible(false);
  };
  if (!visible) return null;
  return (
    <Box sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1000, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, boxShadow: 2 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        We use cookies to improve your experience, analyze usage, and enhance security.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => setVisible(false)}>Dismiss</Button>
        <Button variant="contained" onClick={accept}>Accept</Button>
      </Box>
    </Box>
  );
}
