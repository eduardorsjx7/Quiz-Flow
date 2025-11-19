import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import api from '../../services/api';

const ParticipanteEntrada: React.FC = () => {
  const navigate = useNavigate();
  const [codigoSessao, setCodigoSessao] = useState('');
  const [nomeParticipante, setNomeParticipante] = useState('');
  const [matricula, setMatricula] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!codigoSessao.trim()) {
      setErro('Código da sessão é obrigatório');
      return;
    }

    if (!nomeParticipante.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    try {
      // Verificar se a sessão existe
      const sessaoRes = await api.get(`/sessoes/codigo/${codigoSessao.toUpperCase()}`);
      
      if (sessaoRes.data.status === 'FINALIZADA') {
        setErro('Esta sessão já foi finalizada');
        return;
      }

      // Entrar na sessão
      const participanteRes = await api.post(`/sessoes/${codigoSessao.toUpperCase()}/entrar`, {
        nomeParticipante,
        matricula: matricula || null
      });

      navigate(`/participante/quiz/${codigoSessao.toUpperCase()}`, {
        state: {
          participanteId: participanteRes.data.id,
          sessaoId: sessaoRes.data.sessaoId
        }
      });
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao entrar na sessão');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Entrar no Quiz
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Informe o código da sessão e seus dados
          </Typography>

          {erro && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erro}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Código da Sessão"
              value={codigoSessao}
              onChange={(e) => setCodigoSessao(e.target.value.toUpperCase())}
              margin="normal"
              required
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              fullWidth
              label="Seu Nome"
              value={nomeParticipante}
              onChange={(e) => setNomeParticipante(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Matrícula (opcional)"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              Entrar
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ParticipanteEntrada;

