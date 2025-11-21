import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Route as RouteIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Jornada {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  _count: {
    fases: number;
  };
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarJornadas();
  }, []);

  const carregarJornadas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jornadas');
      const dados = response.data.data || response.data;
      setJornadas(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setErro(error.response?.data?.error?.message || 'Erro ao carregar jornadas');
      setJornadas([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Painel Administrativo">
      <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#011b49' }}>
            Jornadas do PDC
          </Typography>

          {erro && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
              {erro}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
              <CircularProgress sx={{ color: '#ff2c19' }} />
            </Box>
          ) : jornadas.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma jornada cadastrada
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Crie uma nova jornada usando o menu lateral
              </Typography>
              <Button
                variant="contained"
                startIcon={<RouteIcon />}
                onClick={() => navigate('/admin/jornadas/novo')}
                sx={{ mt: 2 }}
              >
                Criar Primeira Jornada
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {jornadas.map((jornada: Jornada, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={jornada.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                      '@keyframes fadeInUp': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(20px)',
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)',
                        },
                      },
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 12px 32px rgba(255, 44, 25, 0.2)',
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', flex: 1, color: '#011b49' }}>
                          {jornada.titulo}
                        </Typography>
                        <Chip
                          label={jornada.ativo ? 'Ativa' : 'Inativa'}
                          color={jornada.ativo ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      {jornada.descricao && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {jornada.descricao}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                        <RouteIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary">
                          {jornada._count.fases} {jornada._count.fases === 1 ? 'Fase' : 'Fases'}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/admin/jornadas/${jornada.id}`)}
                        sx={{ 
                          fontWeight: 'bold',
                          py: 1.5,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #e62816 0%, #ff2c19 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(255, 44, 25, 0.3)',
                          },
                          transition: 'all 0.3s ease-in-out',
                        }}
                      >
                        Ver Jornada
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
    </AdminLayout>
  );
};

export default AdminDashboard;
