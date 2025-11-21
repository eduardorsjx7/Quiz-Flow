import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminFases from './pages/admin/Fases';
import AdminQuizzesFase from './pages/admin/QuizzesFase';
import AdminQuizCreate from './pages/admin/QuizCreate';
import AdminPerguntasFase from './pages/admin/PerguntasFase';
import AdminRelatorios from './pages/admin/Relatorios';
import AtribuirQuiz from './pages/admin/AtribuirQuiz';
import AdminUsuarios from './pages/admin/Usuarios';
import CriarUsuario from './pages/admin/CriarUsuario';
import AdminJornadas from './pages/admin/Jornadas';
import CriarJornada from './pages/admin/CriarJornada';
import DetalhesJornada from './pages/admin/DetalhesJornada';
import DefinirFaseAtual from './pages/admin/DefinirFaseAtual';
import FaseAtual from './pages/participante/FaseAtual';
import ParticipanteQuiz from './pages/participante/Quiz';
import ParticipanteResultado from './pages/participante/Resultado';
import ParticipanteQuizzesFase from './pages/participante/QuizzesFase';
import DashboardColaborador from './pages/participante/Dashboard';
import Fases from './pages/Fases';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
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
          path="/fase-atual"
          element={
            <PrivateRoute>
              <FaseAtual />
            </PrivateRoute>
          }
        />
        <Route
          path="/fases"
          element={
            <PrivateRoute>
              <Fases />
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
          path="/admin/fases/:faseId/quizzes"
          element={
            <PrivateRoute>
              <AdminQuizzesFase />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/fases/:faseId/quiz/novo"
          element={
            <PrivateRoute>
              <AdminQuizCreate />
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
          path="/admin/quizzes/:quizId/atribuir"
          element={
            <PrivateRoute>
              <AtribuirQuiz />
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
          path="/admin/usuarios/:usuarioId/definir-fase"
          element={
            <PrivateRoute>
              <DefinirFaseAtual />
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
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

