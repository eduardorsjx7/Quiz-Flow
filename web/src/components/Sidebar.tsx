import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Collapse,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { MenuItem } from '../config/menuConfig';
import { useNavigation } from '../contexts/NavigationContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  drawerWidth?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  usuarioNome?: string;
  usuarioTipo?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  items,
  drawerWidth = 280,
  collapsed = false,
  onToggleCollapse,
  usuarioNome,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkNavigation } = useNavigation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoverCollapsed, setHoverCollapsed] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Colapso efetivo no desktop
  const isCollapsed = isMobile ? false : (collapsed && !hoverCollapsed);
  const showTexts = !isCollapsed;
  const desktopWidth = isCollapsed ? 80 : drawerWidth;

  const handleMouseEnter = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (collapsed) {
      setHoverCollapsed(true);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    hoverTimeoutRef.current = setTimeout(() => {
      if (collapsed) {
        setHoverCollapsed(false);
      }
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleItemClick = async (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(item.id)) {
        newExpanded.delete(item.id);
      } else {
        newExpanded.add(item.id);
      }
      setExpandedItems(newExpanded);
    } else if (item.path) {
      // Verificar se há interceptação de navegação
      const canNavigate = await checkNavigation(item.path);
      if (canNavigate) {
        navigate(item.path);
        if (isMobile) {
          onClose();
        }
      }
    } else if (item.onClick) {
      item.onClick();
      if (isMobile) {
        onClose();
      }
    }
  };

  const isActive = (item: MenuItem): boolean => {
    // Exceção: rota de Configurar Jornada deve ativar "Fases" e não "Jornadas"
    const isConfigurarJornadaPath = /^\/admin\/jornadas\/\d+\/configurar$/.test(location.pathname);
    
    // Caso especial: item "Jornadas" (id: 'jornadas') deve estar ativo para rotas relacionadas a jornadas
    // Incluindo /admin/jornadas/:id (detalhes), mas não /admin/jornadas/novo
    // Exceção: não ativar para rota de configurar jornada
    if (item.id === 'jornadas') {
      if (isConfigurarJornadaPath) {
        return false; // Não ativar Jornadas para rota de configurar
      }
      
      // Para admin
      const isAdminJornadasPath =
        location.pathname === '/admin/jornadas' ||
        /^\/admin\/jornadas\/\d+$/.test(location.pathname) || // /admin/jornadas/:id
        /^\/admin\/jornadas\/\d+\//.test(location.pathname); // /admin/jornadas/:id/...
      
      // Para participante
      const isParticipanteJornadasPath =
        location.pathname === '/participante/jornadas' ||
        /^\/participante\/jornadas\/\d+\/fases$/.test(location.pathname); // /participante/jornadas/:id/fases
      
      if ((isAdminJornadasPath && !location.pathname.includes('/fases')) || isParticipanteJornadasPath) {
        return true;
      }
    }
    
    if (!item.path) return false;
    
    // Verificação exata primeiro
    if (location.pathname === item.path) {
      return true;
    }
    
    // Paths que devem ser verificados apenas com correspondência exata
    const exactMatchPaths = ['/admin', '/dashboard'];
    if (exactMatchPaths.includes(item.path)) {
      return location.pathname === item.path;
    }
    
    // Caso especial: /admin/fases deve estar ativo para rotas relacionadas a fases
    // Incluindo a rota de Configurar Jornada (exceção)
    if (item.path === '/admin/fases') {
      const isFasesPath =
        location.pathname === '/admin/fases' ||
        location.pathname.startsWith('/admin/fases/') ||
        /^\/admin\/jornadas\/[^/]+\/fases/.test(location.pathname) ||
        isConfigurarJornadaPath; // Exceção: configurar jornada ativa Fases
      return isFasesPath;
    }
    
    // Se o item tem filhos, verificar se algum filho está ativo
    if (item.children && item.children.length > 0) {
      return hasActiveChild(item);
    }
    
    // Para outros paths, verificar se o pathname começa com o path + '/'
    // Mas garantir que não seja apenas uma parte do path
    // Exemplo: '/admin/jornadas' não deve ativar '/admin'
    const pathWithSlash = item.path + '/';
    if (location.pathname.startsWith(pathWithSlash)) {
      const pathParts = item.path.split('/').filter(Boolean);
      const locationParts = location.pathname.split('/').filter(Boolean);
      
      // Se o pathname atual tem mais partes que o path do item,
      // significa que existe um path mais específico, então este não deve estar ativo
      // Exemplo: se estamos em '/admin/jornadas/novo' e o item é '/admin/jornadas',
      // não devemos marcar '/admin/jornadas' como ativo
      if (locationParts.length > pathParts.length) {
        return false;
      }
      
      // Se têm o mesmo número de partes, verificar correspondência exata
      if (locationParts.length === pathParts.length) {
        return pathParts.every((part, index) => locationParts[index] === part);
      }
      
      return false;
    }
    
    return false;
  };

  const hasActiveChild = (item: MenuItem): boolean => {
    if (!item.children) return false;
    return item.children.some(
      (child) => isActive(child) || hasActiveChild(child)
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    if (item.divider && !item.text) {
      return (
        <Divider
          key={item.id}
          sx={{
            my: 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      );
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item) || hasActiveChild(item);
    const paddingLeft = level * 2 + 2;
    const badgeValue =
      typeof item.badge === 'function' ? item.badge() : item.badge;

    return (
      <React.Fragment key={item.id}>
        {item.divider && (
          <Divider
            sx={{
              my: 1,
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            disabled={!item.path && !item.onClick && !hasChildren}
            sx={{
              pl: paddingLeft,
              py: 1.5,
              borderRadius: 2,
              mx: 1,
              mb: 0.5,
              justifyContent: 'flex-start',
              backgroundColor: active ? 'transparent' : 'transparent',
              background: active
                ? 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)'
                : 'transparent',
              color: active ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: active
                  ? '#e62816'
                  : 'rgba(255, 44, 25, 0.08)',
                background: active
                  ? '#e62816'
                  : 'rgba(255, 44, 25, 0.08)',
              },
              '&:disabled': {
                opacity: 0.5,
              },
              transition:
                'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s linear',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: active ? '#ff2c19' : 'transparent',
                borderRadius: '0 4px 4px 0',
                transition:
                  'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: active ? 'white' : 'primary.main',
                minWidth: 40,
                justifyContent: 'center',
                transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: active ? 600 : 400,
                fontSize: '0.95rem',
                color: 'inherit',
              }}
              sx={{
                opacity: showTexts ? 1 : 0,
                transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            />

            {badgeValue !== undefined && badgeValue > 0 && (
              <Box
                sx={{
                  bgcolor: active ? 'primary.contrastText' : 'error.main',
                  color: active ? 'primary.main' : 'error.contrastText',
                  borderRadius: '12px',
                  px: 1,
                  py: 0.25,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  ml: 1,
                  minWidth: '20px',
                  textAlign: 'center',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1,
                    },
                    '50%': {
                      opacity: 0.7,
                    },
                  },
                  opacity: showTexts ? 1 : 0,
                  transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {badgeValue}
              </Box>
            )}

            {hasChildren && (
              <Box
                sx={{
                  transition:
                    'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  opacity: showTexts ? 1 : 0,
                }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded && showTexts} timeout={250} unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {/* Header / Perfil do Usuário */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          px: 2,
          backgroundColor: 'transparent',
          color: 'text.primary',
          height: 80,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              flexShrink: 0,
            }}
          >
            <AccountCircleIcon
              sx={{
                fontSize: 32,
                width: '100%',
                height: '100%',
              }}
            />
          </Avatar>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              ml: 1,
              opacity: showTexts ? 1 : 0,
              maxWidth: showTexts ? '100%' : 0,
              transition:
                'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {usuarioNome || 'Usuário'}
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider sx={{ flexShrink: 0 }} />

      {/* Menu Items */}
      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          py: 1,
        }}
      >
        <List sx={{ width: '100%', px: 0 }}>
          {items.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          px: 2,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            opacity: showTexts ? 1 : 0,
            transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          © 2025 Quiz Flow
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            boxShadow: 3,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: desktopWidth,
            boxShadow: 3,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden',
            overflowY: 'auto',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(0,0,0,0.3)',
              },
            },
          },
        }}
        open
      >
        <Box
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{ width: '100%', height: '100%', position: 'relative' }}
        >
          {drawerContent}
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;
