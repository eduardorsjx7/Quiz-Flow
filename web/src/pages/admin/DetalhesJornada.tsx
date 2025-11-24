import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface EstatisticasFase {
  faseId: number;
  faseTitulo: string;
  faseDescricao?: string;
  totalQuizzes: number;
  totalTentativas: number;
  totalAcertos: number;
  totalPerguntas: number;
  percentualAcertos: number;
  pontuacaoMedia: number;
}

interface RankingItem {
  usuario: {
    id: number;
    nome: string;
    email?: string;
    matricula?: string;
  };
  pontuacaoTotal: number;
  tentativas: number;
  acertos: number;
  totalPerguntas: number;
  percentualAcertos: number;
  posicao: number;
}

interface EstatisticasCompletas {
  jornada: {
    id: number;
    titulo: string;
    descricao?: string;
    ordem: number;
    ativo: boolean;
    totalFases: number;
  };
  estatisticasGerais: {
    totalFases: number;
    totalQuizzes: number;
    totalTentativas: number;
    totalUsuariosParticipantes: number;
    pontuacaoMediaGeral: number;
    percentualAcertosGeral: number;
    totalAcertos: number;
    totalPerguntas: number;
  };
  estatisticasPorFase: EstatisticasFase[];
  ranking: RankingItem[];
}

const DetalhesJornada: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dados, setDados] = useState<EstatisticasCompletas | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarEstatisticas = React.useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/jornadas/${id}/estatisticas`);
      setDados(response.data.data || response.data);
    } catch (error: any) {
      setErro(error.response?.data?.error?.message || 'Erro ao carregar estatísticas da jornada');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  if (loading) {
    return (
      <AdminLayout title="Carregando...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress sx={{ color: '#ff2c19' }} />
        </Box>
      </AdminLayout>
    );
  }

  if (erro || !dados) {
    return (
      <AdminLayout title="Erro">
        <Container>
          <Alert severity="error" sx={{ mt: 4, borderRadius: 2 }}>
            {erro || 'Erro ao carregar dados'}
          </Alert>
        </Container>
      </AdminLayout>
    );
  }

  const { jornada, estatisticasGerais, estatisticasPorFase, ranking } = dados;

  // Preparar dados para gráfico de acertos por fase
  const dadosGraficoAcertos = estatisticasPorFase.map((fase) => ({
    nome: fase.faseTitulo,
    acertos: fase.totalAcertos,
    erros: fase.totalPerguntas - fase.totalAcertos,
    percentual: fase.percentualAcertos,
  }));

  // Preparar dados para gráfico de participação
  const dadosParticipacao = estatisticasPorFase.map((fase) => ({
    nome: fase.faseTitulo,
    tentativas: fase.totalTentativas,
  }));

  return (
    <AdminLayout title={`Detalhes da Jornada - ${dados?.jornada.titulo || ''}`}>
      <Container maxWidth="lg">
        <Breadcrumbs 
          sx={{ 
            mb: 3,
            '& .MuiBreadcrumbs-separator': {
              mx: 1.5,
              color: 'text.disabled',
            },
          }}
        >
          <Link
            component="button"
            onClick={() => navigate('/admin')}
            sx={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              borderRadius: 1,
              p: 0.5,
              '&:hover': { 
                color: 'primary.main',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            title="Dashboard"
          >
            <HomeIcon sx={{ fontSize: 20 }} />
          </Link>
          <Link
            component="button"
            onClick={() => navigate('/admin/jornadas')}
            sx={{ 
              cursor: 'pointer', 
              textDecoration: 'none',
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              borderRadius: 1,
              px: 0.75,
              py: 0.5,
              fontWeight: 400,
              '&:hover': { 
                color: 'primary.main',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                textDecoration: 'none',
              },
            }}
          >
            Jornadas
          </Link>
          <Typography 
            color="text.primary"
            sx={{
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Detalhes da Jornada
          </Typography>
        </Breadcrumbs>

        {/* Cabeçalho */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #011b49 0%, #1a3a6b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 0.5,
                  letterSpacing: '-0.02em',
                }}
              >
                {jornada.titulo}
              </Typography>
              {jornada.descricao && (
                <Typography variant="body1" color="text.secondary" sx={{ color: '#6b7280' }}>
                  {jornada.descricao}
                </Typography>
              )}
            </Box>
            <Chip
              label={jornada.ativo ? 'Ativa' : 'Inativa'}
              color={jornada.ativo ? 'success' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>

        {/* Estatísticas Gerais */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssessmentIcon sx={{ fontSize: 40, color: '#ff2c19', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#011b49' }}>{estatisticasGerais.totalFases}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ color: '#6b7280' }}>
                      Fases
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#25bf6a', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#011b49' }}>{estatisticasGerais.totalUsuariosParticipantes}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ color: '#6b7280' }}>
                      Participantes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#25bf6a', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#011b49' }}>{estatisticasGerais.percentualAcertosGeral}%</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ color: '#6b7280' }}>
                      Taxa de Acertos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#ffbb02', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#011b49' }}>{estatisticasGerais.pontuacaoMediaGeral}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ color: '#6b7280' }}>
                      Pontuação Média
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gráficos */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#011b49' }}>
                Taxa de Acertos por Fase
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGraficoAcertos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nome" tick={{ fill: '#011b49' }} />
                  <YAxis tick={{ fill: '#011b49' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid rgba(255, 44, 25, 0.2)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="percentual" fill="#25bf6a" name="Taxa de Acertos (%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#011b49' }}>
                Tentativas por Fase
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosParticipacao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nome" tick={{ fill: '#011b49' }} />
                  <YAxis tick={{ fill: '#011b49' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid rgba(255, 44, 25, 0.2)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="tentativas" fill="#ff2c19" name="Tentativas" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Estatísticas por Fase */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 600, 
              mb: 2, 
              fontSize: '1.5rem',
              color: '#011b49',
            }}
          >
            Estatísticas por Fase
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Fase</strong></TableCell>
                  <TableCell align="center"><strong>Quizzes</strong></TableCell>
                  <TableCell align="center"><strong>Tentativas</strong></TableCell>
                  <TableCell align="center"><strong>Acertos</strong></TableCell>
                  <TableCell align="center"><strong>Taxa de Acertos</strong></TableCell>
                  <TableCell align="center"><strong>Pontuação Média</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {estatisticasPorFase.map((fase) => (
                  <TableRow key={fase.faseId}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#011b49' }}>
                        {fase.faseTitulo}
                      </Typography>
                      {fase.faseDescricao && (
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {fase.faseDescricao}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{fase.totalQuizzes}</TableCell>
                    <TableCell align="center">{fase.totalTentativas}</TableCell>
                    <TableCell align="center">
                      {fase.totalAcertos} / {fase.totalPerguntas}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: '60px', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={fase.percentualAcertos}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: fase.percentualAcertos >= 70 ? '#25bf6a' : fase.percentualAcertos >= 50 ? '#ffbb02' : '#ff2c19',
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: '40px', color: '#011b49', fontWeight: 600 }}>
                          {fase.percentualAcertos}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {fase.pontuacaoMedia}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pódio / Ranking */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmojiEventsIcon sx={{ fontSize: 32, color: '#ffbb02', mr: 1 }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '1.5rem',
                color: '#011b49',
              }}
            >
              Pódio da Jornada
            </Typography>
          </Box>
          
          {ranking.length === 0 ? (
            <Alert severity="info">
              Ainda não há participantes nesta jornada.
            </Alert>
          ) : (
            <>
              {/* Top 3 com destaque */}
              {ranking.length >= 3 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* 2º Lugar */}
                  <Grid item xs={12} md={4} sx={{ order: { xs: 1, md: 1 } }}>
                    <Card sx={{ bgcolor: '#e5e7eb', textAlign: 'center', pt: 2, borderRadius: 2 }}>
                      <Typography variant="h3" sx={{ color: '#6b7280', mb: 1, fontWeight: 'bold' }}>2º</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#011b49' }}>
                        {ranking[1].usuario.nome}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {ranking[1].pontuacaoTotal} pontos
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {ranking[1].percentualAcertos}% de acertos
                      </Typography>
                    </Card>
                  </Grid>

                  {/* 1º Lugar */}
                  <Grid item xs={12} md={4} sx={{ order: { xs: 2, md: 2 } }}>
                    <Card sx={{ bgcolor: '#fff9c4', textAlign: 'center', pt: 2, border: '2px solid #ffbb02', borderRadius: 2 }}>
                      <EmojiEventsIcon sx={{ fontSize: 48, color: '#ffbb02', mb: 1 }} />
                      <Typography variant="h3" sx={{ color: '#011b49', mb: 1, fontWeight: 'bold' }}>1º</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#011b49' }}>
                        {ranking[0].usuario.nome}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {ranking[0].pontuacaoTotal} pontos
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {ranking[0].percentualAcertos}% de acertos
                      </Typography>
                    </Card>
                  </Grid>

                  {/* 3º Lugar */}
                  <Grid item xs={12} md={4} sx={{ order: { xs: 3, md: 3 } }}>
                    <Card sx={{ bgcolor: '#fff4e0', textAlign: 'center', pt: 2, borderRadius: 2, border: '1px solid #ffbb02' }}>
                      <Typography variant="h3" sx={{ color: '#011b49', mb: 1, fontWeight: 'bold' }}>3º</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#011b49' }}>
                        {ranking[2].usuario.nome}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {ranking[2].pontuacaoTotal} pontos
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {ranking[2].percentualAcertos}% de acertos
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Tabela completa do ranking */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#011b49' }}>
                Ranking Completo
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Posição</strong></TableCell>
                      <TableCell><strong>Participante</strong></TableCell>
                      <TableCell align="center"><strong>Pontuação</strong></TableCell>
                      <TableCell align="center"><strong>Tentativas</strong></TableCell>
                      <TableCell align="center"><strong>Taxa de Acertos</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ranking.map((item) => (
                      <TableRow key={item.usuario.id}>
                        <TableCell>
                          <Chip
                            label={item.posicao}
                            sx={{
                              backgroundColor: item.posicao === 1 ? '#ffbb02' : item.posicao === 2 ? '#e5e7eb' : item.posicao === 3 ? '#fff4e0' : '#f3f4f6',
                              color: item.posicao === 1 ? '#011b49' : item.posicao === 2 ? '#6b7280' : item.posicao === 3 ? '#011b49' : '#6b7280',
                              fontWeight: 600,
                            }}
                            size="small"
                          />
                        </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: item.posicao <= 3 ? 'bold' : 'normal', color: '#011b49' }}>
                        {item.usuario.nome}
                      </Typography>
                      {item.usuario.matricula && (
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Matrícula: {item.usuario.matricula}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#011b49' }}>
                        {item.pontuacaoTotal}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{item.tentativas}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${item.percentualAcertos}%`}
                        sx={{
                          backgroundColor: item.percentualAcertos >= 70 ? '#25bf6a' : item.percentualAcertos >= 50 ? '#ffbb02' : '#ff2c19',
                          color: 'white',
                          fontWeight: 600,
                        }}
                        size="small"
                      />
                    </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      </Container>
    </AdminLayout>
  );
};

export default DetalhesJornada;

