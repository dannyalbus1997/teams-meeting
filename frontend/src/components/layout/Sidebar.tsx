'use client';

import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  VideoCall as VideoCallIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onDrawerToggle?: (open: boolean) => void;
}

/**
 * Sidebar navigation component with responsive drawer
 */
export function Sidebar({ onDrawerToggle }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();

  const handleDrawerToggle = (open: boolean) => {
    setMobileOpen(open);
    onDrawerToggle?.(open);
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <DashboardIcon />,
    },
    {
      label: 'Meetings',
      href: '/meetings',
      icon: <VideoCallIcon />,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VideoCallIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Box sx={{ fontWeight: 700, fontSize: '1.125rem' }}>Teams</Box>
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Summarizer
          </Box>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flex: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={isActive(item.href)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => handleDrawerToggle(true)}
          sx={{ display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => handleDrawerToggle(false)}
          ModalProps={{
            keepMounted: true,
          }}
        >
          <Box
            sx={{ width: 280 }}
            role="presentation"
            onClick={() => handleDrawerToggle(false)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            {drawerContent}
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
