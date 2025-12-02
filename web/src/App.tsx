import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext';
import { NavigationProvider } from './contexts/NavigationContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminFases from './pages/admin/Fases';
import FasesJornada from './pages/admin/FasesJornada';
import AdminPerguntasFase from './pages/admin/PerguntasFase';
import AdminRelatorios from './pages/admin/Relatorios';
import AdminUsuarios from './pages/admin/Usuarios';
import CriarUsuario from './pages/admin/CriarUsuario';
import AdminJornadas from './pages/admin/Jornadas';
import CriarJornada from './pages/admin/CriarJornada';
import DetalhesJornada from './pages/admin/DetalhesJornada';
import ConfigurarJornada from './pages/admin/ConfigurarJornada';
import ParticipanteQuiz from './pages/participante/Quiz';
import ParticipanteResultado from './pages/participante/Resultado';
import RankingCompleto from './pages/participante/RankingCompleto';
import ParticipanteQuizzesFase from './pages/participante/QuizzesFase';
import DashboardColaborador from './pages/participante/Dashboard';
import FasesJornadaParticipante from './pages/participante/FasesJornada';
import Pontuacoes from './pages/participante/Pontuacoes';
import Avaliacoes from './pages/participante/Avaliacoes';
import JornadasParticipante from './pages/participante/Jornadas';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <NavigationProvider>
            <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardColaborador />
            </PrivateRoute>
          }
        />
        <Route
          path="/avaliacoes"
          element={
            <PrivateRoute>
              <Avaliacoes />
            </PrivateRoute>
          }
        />
        <Route
          path="/pontuacoes"
          element={
            <PrivateRoute>
              <Pontuacoes />
            </PrivateRoute>
          }
        />
        <Route
          path="/participante/jornadas"
          element={
            <PrivateRoute>
              <JornadasParticipante />
            </PrivateRoute>
          }
        />
        <Route
          path="/participante/jornadas/:jornadaId/fases"
          element={
            <PrivateRoute>
              <FasesJornadaParticipante />
            </PrivateRoute>
          }
        />
        <Route
          path="/fases/:faseId/quizzes"
          element={
            <PrivateRoute>
              <ParticipanteQuizzesFase />
            </PrivateRoute>
          }
        />
        <Route path="/participante/quiz/:tentativaId" element={<ParticipanteQuiz />} />
        <Route path="/participante/resultado/:tentativaId" element={<ParticipanteResultado />} />
        <Route path="/participante/ranking/:tentativaId" element={<RankingCompleto />} />
        
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/fases"
          element={
            <PrivateRoute>
              <AdminFases />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/jornadas/:jornadaId/fases"
          element={
            <PrivateRoute>
              <FasesJornada />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/fases/:faseId/perguntas"
          element={
            <PrivateRoute>
              <AdminPerguntasFase />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/relatorios"
          element={
            <PrivateRoute>
              <AdminRelatorios />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <PrivateRoute>
              <AdminUsuarios />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/usuarios/novo"
          element={
            <PrivateRoute>
              <CriarUsuario />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/jornadas"
          element={
            <PrivateRoute>
              <AdminJornadas />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/jornadas/novo"
          element={
            <PrivateRoute>
              <CriarJornada />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/jornadas/:id"
          element={
            <PrivateRoute>
              <DetalhesJornada />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/jornadas/:jornadaId/configurar"
          element={
            <PrivateRoute>
              <ConfigurarJornada />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
          </NavigationProvider>
        </ConfirmDialogProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

