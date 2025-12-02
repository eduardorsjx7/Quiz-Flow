import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import { getParticipanteMenuItems } from '../config/menuConfig';

interface ParticipantLayoutProps {
  children: React.ReactNode;
  title?: string;
  drawerWidth?: number;
  noPadding?: boolean;
}

const ParticipantLayout: React.FC<ParticipantLayoutProps> = ({
  children,
  title = 'Quiz Flow',
  drawerWidth = 280,
  noPadding = false,
}) => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(true); // Começa colapsado por padrão

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      overflow: 'hidden',
      overflowX: 'hidden',
    }}>
      {/* Sidebar Dinâmico */}
      <Sidebar
        open={mobileOpen}
        onClose={handleDrawerToggle}
        items={getParticipanteMenuItems(handleLogout)}
        drawerWidth={drawerWidth}
        collapsed={desktopCollapsed}
        onToggleCollapse={handleDesktopToggle}
        usuarioNome={usuario?.nome}
        usuarioTipo={usuario?.tipo}
      />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', sm: `calc(100% - ${desktopCollapsed ? 80 : drawerWidth}px)` },
          maxWidth: '100vw',
          ml: { sm: `${desktopCollapsed ? 80 : drawerWidth}px` },
          backgroundColor: '#fff',
          color: '#011b49',
          boxShadow: '0 1px 3px rgba(1, 27, 73, 0.1)',
          zIndex: 10000, // Na frente de tudo (confetes, podium, etc)
          borderBottom: '1px solid rgba(255, 44, 25, 0.1)',
          transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'center', 
          position: 'relative',
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2 },
        }}>
          {/* Botão de menu apenas para mobile */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              position: 'absolute',
              left: 16,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo Centralizada */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <img 
              src="/logo/logo1.svg" 
              alt="Quiz Flow Logo" 
              style={{ 
                height: '55px', 
                width: 'auto',
              }}
            />
          </Box>
          
        </Toolbar>
      </AppBar>

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: noPadding ? 0 : 3,
          width: { xs: '100%', sm: `calc(100% - ${desktopCollapsed ? 80 : drawerWidth}px)` },
          maxWidth: '100vw',
          ml: { sm: `${desktopCollapsed ? 80 : drawerWidth}px` },
          backgroundColor: noPadding ? 'transparent' : '#f5f5f5',
          minHeight: '100vh',
          transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          overflowX: 'hidden',
        }}
      >
        {!noPadding && <Toolbar />}
        {children}
      </Box>
    </Box>
  );
};

export default ParticipantLayout;

