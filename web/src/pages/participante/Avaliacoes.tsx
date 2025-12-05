import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  RateReview as RateReviewIcon,
  Assignment as AssignmentIcon,
  Route as RouteIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import AlertFixed from '../../components/AlertFixed';

interface AvaliacaoFase {
  id: number;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  obrigatorio: boolean;
  faseCompletada: boolean;
  jornada: {
    id: number;
    titulo: string;
  };
  fase: {
    id: number;
    titulo: string;
    ordem: number;
  };
  perguntas: Array<{
    id: number;
    texto: string;
    tipo: string;
    ordem: number;
    obrigatoria: boolean;
    peso: number;
  }>;
  _count: {
    respostas: number;
  };
}

const Avaliacoes: React.FC = () => {
  const navigate = useNavigate();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      setLoading(true);
      setErro('');
      const response = await api.get('/avaliacoes/disponiveis');
      const data = response.data.data || response.data;
      setAvaliacoes(data);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const handleResponderAvaliacao = (avaliacaoId: number) => {
    navigate(`/participante/responder-avaliacao/${avaliacaoId}`);
  };

  if (loading) {
    return (
      <ParticipantLayout title="Avaliações de Fases">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout title="Avaliações de Fases">
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <RateReviewIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Avaliações de Fases
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avalie as fases que você já completou
            </Typography>
          </Box>
        </Box>

        {erro && (
          <AlertFixed 
            severity="error"
            message={erro}
            onClose={() => setErro('')}
          />
        )}

        {avaliacoes.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma avaliação disponível
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete as fases das jornadas para desbloquear as avaliações.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {avaliacoes.map((avaliacao) => (
              <Grid item xs={12} md={6} lg={4} key={avaliacao.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                        {avaliacao.fase.titulo}
                      </Typography>
                      {avaliacao.obrigatorio && (
                        <Chip
                          label="Obrigatória"
                          color="error"
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <RouteIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {avaliacao.jornada.titulo}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AssignmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Fase {avaliacao.fase.ordem}
                        </Typography>
                      </Box>
                    </Box>

                    {avaliacao.descricao && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {avaliacao.descricao}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{avaliacao.perguntas.length}</strong> {avaliacao.perguntas.length === 1 ? 'pergunta' : 'perguntas'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<RateReviewIcon />}
                      onClick={() => handleResponderAvaliacao(avaliacao.id)}
                      sx={{
                        bgcolor: '#ff2c19',
                        '&:hover': {
                          bgcolor: '#e62816',
                        },
                      }}
                    >
                      Responder Avaliação
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </ParticipantLayout>
  );
};

export default Avaliacoes;
