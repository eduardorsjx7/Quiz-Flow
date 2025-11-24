import React from 'react';
import {
  PersonAdd as PersonAddIcon,
  Route as RouteIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  ExitToApp as ExitToAppIcon,
  EmojiEvents as TrophyIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';

export interface MenuItem {
  id: string;
  text: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  children?: MenuItem[];
  badge?: number | (() => number);
  divider?: boolean;
  roles?: string[]; // Tipos de usuário que podem ver este item
  visible?: boolean | (() => boolean); // Função para determinar visibilidade dinâmica
}

/**
 * Gera os itens do menu do admin
 * @param userRole - Tipo do usuário (ADMINISTRADOR, COLABORADOR)
 * @param badgeCounts - Objeto com contadores para badges dinâmicos
 * @param onLogout - Função para executar logout
 */
export const getAdminMenuItems = (
  userRole?: string,
  badgeCounts?: { relatorios?: number },
  onLogout?: () => void
): MenuItem[] => {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin',
      roles: ['ADMINISTRADOR'],
    },
    {
      id: 'jornadas',
      text: 'Jornadas',
      icon: <RouteIcon />,
      roles: ['ADMINISTRADOR'],
      children: [
        {
          id: 'listar-jornadas',
          text: 'Todas as Jornadas',
          icon: <RouteIcon />,
          path: '/admin/jornadas',
        },
        {
          id: 'criar-jornada',
          text: 'Criar Jornada PDC',
          icon: <PersonAddIcon />,
          path: '/admin/jornadas/novo',
        },
      ],
    },
    {
      id: 'fases',
      text: 'Fases',
      icon: <SchoolIcon />,
      path: '/admin/fases',
      roles: ['ADMINISTRADOR'],
    },
    {
      id: 'usuarios',
      text: 'Usuários',
      icon: <PeopleIcon />,
      roles: ['ADMINISTRADOR'],
      children: [
        {
          id: 'listar-usuarios',
          text: 'Todos os Usuários',
          icon: <PeopleIcon />,
          path: '/admin/usuarios',
        },
        {
          id: 'criar-usuario',
          text: 'Cadastrar Usuário',
          icon: <PersonAddIcon />,
          path: '/admin/criar-usuario',
        },
      ],
    },
    {
      id: 'relatorios',
      text: 'Relatórios',
      icon: <AssessmentIcon />,
      path: '/admin/relatorios',
      roles: ['ADMINISTRADOR'],
      badge: badgeCounts?.relatorios || 0,
    },
    {
      id: 'divider-1',
      text: '',
      icon: <></>,
      divider: true,
      roles: ['ADMINISTRADOR'],
    },
    {
      id: 'configuracoes',
      text: 'Configurações',
      icon: <SettingsIcon />,
      roles: ['ADMINISTRADOR'],
      children: [
        {
          id: 'grupos',
          text: 'Grupos',
          icon: <GroupIcon />,
          path: '/admin/grupos',
        },
      ],
    },
    {
      id: 'sair',
      text: 'Sair',
      icon: <ExitToAppIcon />,
      onClick: onLogout,
      roles: ['ADMINISTRADOR'],
    },
  ];

  return menuItems.filter((item) => {
    // Filtrar itens baseado no role do usuário
    if (item.roles && !item.roles.includes(userRole || '')) {
      return false;
    }
    // Verificar visibilidade dinâmica
    if (item.visible !== undefined) {
      const visible = typeof item.visible === 'function' ? item.visible() : item.visible;
      if (!visible) return false;
    }
    return true;
  });
};

/**
 * Itens do menu para participantes/colaboradores
 * @param onLogout - Função de logout para o item 'Sair'
 */
export const getParticipanteMenuItems = (onLogout?: () => void): MenuItem[] => [
  {
    id: 'dashboard',
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'avaliacoes',
    text: 'Avaliações',
    icon: <QuizIcon />,
    path: '/avaliacoes',
  },
  {
    id: 'pontuacoes',
    text: 'Pontuações',
    icon: <TrophyIcon />,
    path: '/pontuacoes',
  },
  {
    id: 'divider-1',
    text: '',
    icon: <></>,
    divider: true,
  },
  {
    id: 'sair',
    text: 'Sair',
    icon: <ExitToAppIcon />,
    onClick: onLogout,
  },
];

// Exportar versão estática para compatibilidade
export const adminMenuItems: MenuItem[] = getAdminMenuItems('ADMINISTRADOR');
export const participanteMenuItems: MenuItem[] = getParticipanteMenuItems();

