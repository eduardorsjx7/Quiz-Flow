import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminQuizzes from './pages/admin/Quizzes';
import AdminQuizCreate from './pages/admin/QuizCreate';
import AdminRelatorios from './pages/admin/Relatorios';
import ParticipanteEntrada from './pages/participante/Entrada';
import ParticipanteQuiz from './pages/participante/Quiz';
import ParticipanteResultado from './pages/participante/Resultado';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/participante/entrada" element={<ParticipanteEntrada />} />
        <Route path="/participante/quiz/:codigoSessao" element={<ParticipanteQuiz />} />
        <Route path="/participante/resultado/:sessaoParticipanteId" element={<ParticipanteResultado />} />
        
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/quizzes"
          element={
            <PrivateRoute>
              <AdminQuizzes />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/quizzes/novo"
          element={
            <PrivateRoute>
              <AdminQuizCreate />
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
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

