import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import AlertFixed from '../../components/AlertFixed';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../../components/LoadingScreen';

interface RankingItem {
  posicao: number;
  usuario: {
    id: number;
    nome: string;
  };
  pontuacaoTotal: number;
}

interface EstatisticasUsuario {
  pontuacaoTotal: number;
  totalQuizzes: number;
  quizzesConcluidos: number;
  taxaAcerto: number;
  posicaoRanking: number;
}

const Pontuacoes: React.FC = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [rankingGeral, setRankingGeral] = useState<RankingItem[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | null>(null);
  const [abaAtiva, setAbaAtiva] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar tentativas do usuário para calcular estatísticas
      const tentativasRes = await api.get('/tentativas/usuario/minhas');
      const tentativas = tentativasRes.data.data || tentativasRes.data || [];
      
      // Calcular estatísticas do usuário
      const tentativasConcluidas = tentativas.filter((t: any) => t.status === 'CONCLUIDA' || t.status === 'FINALIZADA');
      const pontuacaoTotal = tentativasConcluidas.reduce((sum: number, t: any) => sum + (t.pontuacaoTotal || 0), 0);
      const totalRespostas = tentativasConcluidas.reduce((sum: number, t: any) => sum + (t.respostas?.length || 0), 0);
      const totalAcertos = tentativasConcluidas.reduce((sum: number, t: any) => {
        return sum + (t.respostas?.filter((r: any) => r.acertou)?.length || 0);
      }, 0);
      const taxaAcerto = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0;

      setEstatisticas({
        pontuacaoTotal,
        totalQuizzes: tentativas.length,
        quizzesConcluidos: tentativasConcluidas.length,
        taxaAcerto,
        posicaoRanking: 0, // Ranking geral não disponível por enquanto
      });
      
      // Ranking geral não disponível - deixar vazio por enquanto
      setRankingGeral([]);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar pontuações');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingScreen 
        messages={[
          'Calculando suas pontuações',
          'Verificando seu ranking',
          'Você está subindo na classificação!'
        ]}
        messageInterval={1500}
      />
    );
  }

  return (
    <ParticipantLayout title="Pontuações">
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Minhas Pontuações
        </Typography>

        {erro && (
          <AlertFixed 
            severity="error"
            message={erro}
            onClose={() => setErro('')}
          />
        )}

        {estatisticas && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TrophyIcon color="primary" />
                    <Typography variant="h6">Pontuação Total</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {estatisticas.pontuacaoTotal}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6">Quizzes Concluídos</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {estatisticas.quizzesConcluidos}/{estatisticas.totalQuizzes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h6">Taxa de Acerto</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {estatisticas.taxaAcerto}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TrophyIcon color="primary" />
                    <Typography variant="h6">Posição no Ranking</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {estatisticas.posicaoRanking > 0 ? `${estatisticas.posicaoRanking}º` : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={abaAtiva} onChange={(_, novoValor) => setAbaAtiva(novoValor)}>
            <Tab label="Ranking Geral" />
          </Tabs>
        </Box>

        {abaAtiva === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Posição</strong></TableCell>
                  <TableCell><strong>Usuário</strong></TableCell>
                  <TableCell align="right"><strong>Pontuação</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankingGeral.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Nenhum ranking disponível no momento.
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  rankingGeral.map((item, index) => (
                    <TableRow
                      key={item.usuario.id}
                      sx={{
                        backgroundColor: item.usuario.id === usuario?.id ? 'action.selected' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {index < 3 && (
                            <TrophyIcon
                              sx={{
                                color: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32',
                                fontSize: 20,
                              }}
                            />
                          )}
                          <strong>{item.posicao || index + 1}º</strong>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {item.usuario.nome}
                        {item.usuario.id === usuario?.id && (
                          <Chip label="Você" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <strong>{item.pontuacaoTotal}</strong>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </ParticipantLayout>
  );
};

export default Pontuacoes;

