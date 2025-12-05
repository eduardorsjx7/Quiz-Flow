/**
 * Constrói a URL completa da foto de perfil
 * @param fotoPath - Caminho da foto (ex: /uploads/perfis/foto.jpg)
 * @returns URL completa ou null se não houver foto
 */
export const construirUrlFotoPerfil = (fotoPath: string | null | undefined): string | null => {
  if (!fotoPath) return null;
  if (fotoPath.startsWith('http')) return fotoPath;
  
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const baseUrl = apiUrl.replace('/api', ''); // Remove /api se existir
  return `${baseUrl}${fotoPath}`;
};

