import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { QuestionIconFloating } from './QuestionIconFloating';
import './animated-background.css';

interface FaseTabuleiro {
  id: number;
  ordem: number;
  titulo: string;
  desbloqueada?: boolean;
  bloqueada?: boolean;
  finalizada?: boolean;
  faseAberta?: boolean;
  ativo?: boolean;
}

interface FasesTabuleiroProps {
  fases: FaseTabuleiro[];
  onFaseClick?: (faseId: number) => void;
  isAdmin?: boolean;
  showConnections?: boolean;
}

const FasesTabuleiro: React.FC<FasesTabuleiroProps> = ({
  fases,
  onFaseClick,
  isAdmin = false,
  showConnections = true,
}) => {
  const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);

  const cols = 3;
  const svgWidth = 1200;
  const marginX = 120;
  const colSpacing = (svgWidth - marginX * 2) / (cols - 1);

  const marginBottom = 120;
  const rowGap = 140;

  const phaseStepY = 40;
  const circleRadius = 40;

  const total = fasesOrdenadas.length;
  const groups = Math.ceil(total / 3);
  const svgHeight = marginBottom + rowGap * groups + 80;

  const calcularPosicao = (index: number) => {
    const groupIndex = Math.floor(index / 3);
    const indexInGroup = index % 3;

    const rowFromBottom = groupIndex;
    const baseY = svgHeight - marginBottom - rowFromBottom * rowGap;

    let y: number;

    if (indexInGroup === 0) {
      y = baseY;
    } else if (indexInGroup === 1) {
      y = baseY - phaseStepY;
    } else {
      const y2 = baseY - phaseStepY;
      y = y2 - 2 * circleRadius;
    }

    const x = marginX + indexInGroup * colSpacing;

    return { x, y };
  };

  const calcularCurva = (
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
    curvaParaCima: boolean
  ) => {
    const dx = pos2.x - pos1.x;

    const amplitudeUp = 40;
    const amplitudeDown = 80;

    const amplitude = curvaParaCima ? amplitudeUp : amplitudeDown;

    const midY = (pos1.y + pos2.y) / 2;
    const controlY = curvaParaCima ? midY - amplitude : midY + amplitude;

    const c1x = pos1.x + dx * 0.25;
    const c2x = pos1.x + dx * 0.75;

    return `
      M ${pos1.x} ${pos1.y}
      C ${c1x} ${controlY},
        ${c2x} ${controlY},
        ${pos2.x} ${pos2.y}
    `;
  };

  const getStatusFase = (fase: FaseTabuleiro) => {
    if (fase.finalizada) return 'finalizada';
    if (fase.desbloqueada || fase.faseAberta) return 'desbloqueada';
    if (fase.bloqueada || !fase.ativo) return 'bloqueada';
    return 'aguardando';
  };

  const podeClicarFase = (fase: FaseTabuleiro) =>
    (fase.desbloqueada || fase.faseAberta) &&
    !fase.finalizada &&
    fase.ativo !== false;


  const getCircleAppearance = (status: string) => {
    if (status === 'bloqueada') {
      return {
        fill: 'url(#circleBlockedGradient)',
        stroke: 'url(#circleBlockedGradient)',
      };
    }
    return {
      fill: 'url(#circleGradient)',
      stroke: 'url(#circleBorderGradient)',
    };
  };

  const getConnectionColor = (statusProx: string) => {
    if (statusProx === 'bloqueada') return 'rgba(148, 163, 184, 0.7)';
    if (statusProx === 'finalizada') return '#16a34a';
    if (statusProx === 'desbloqueada') return '#ff2c19';
    return 'rgba(15, 23, 42, 0.6)';
  };

  // Interrogações para o tabuleiro (18 interrogações)
  const questionsReduced = useMemo(() => [
    // Cantos
    { color: "#2196F3", width: 100, top: "5%", left: "5%", rotate: -15 },
    { color: "#E62816", width: 120, top: "8%", left: "92%", rotate: 10 },
    { color: "#4CAF50", width: 110, top: "92%", left: "5%", rotate: -8 },
    { color: "#FFC107", width: 125, top: "95%", left: "90%", rotate: -10 },
    // Bordas laterais
    { color: "#2196F3", width: 95, top: "20%", left: "3%", rotate: -12 },
    { color: "#E62816", width: 110, top: "40%", left: "2%", rotate: 14 },
    { color: "#4CAF50", width: 100, top: "60%", left: "3%", rotate: -9 },
    { color: "#FFC107", width: 115, top: "80%", left: "2%", rotate: 8 },
    { color: "#2196F3", width: 95, top: "25%", left: "97%", rotate: -12 },
    { color: "#E62816", width: 110, top: "45%", left: "98%", rotate: 14 },
    { color: "#4CAF50", width: 100, top: "65%", left: "97%", rotate: -9 },
    { color: "#FFC107", width: 115, top: "85%", left: "98%", rotate: 8 },
    // Bordas superior e inferior
    { color: "#2196F3", width: 105, top: "2%", left: "30%", rotate: -5 },
    { color: "#E62816", width: 115, top: "2%", left: "70%", rotate: 7 },
    { color: "#4CAF50", width: 100, top: "98%", left: "30%", rotate: -5 },
    { color: "#FFC107", width: 110, top: "98%", left: "70%", rotate: 7 },
    // Centro
    { color: "#2196F3", width: 90, top: "50%", left: "25%", rotate: -6 },
    { color: "#E62816", width: 105, top: "50%", left: "75%", rotate: 9 },
  ].map((q, i) => ({
    ...q,
    delay: Math.random() * 3,
    duration: Math.random() * 1.5 + 5.5,
  })), []);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          borderRadius: 3,
          padding: '3px',
          background: 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
          boxShadow: '0 2px 12px rgba(1, 27, 73, 0.08)',
          transition: 'all 0.3s ease-in-out',
          width: '100%',
          maxWidth: '95%',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(1, 27, 73, 0.12)',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2.5,
            padding: 4,
            background: '#ffffff',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Fundo animado com interrogações (reduzido e desfocado) */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              filter: 'blur(3px)',
              opacity: 0.4,
            }}
          >
            <div className="animated-background">
              {/* Gradiente de fundo */}
              <div className="bg-gradient" />
              
              {/* Interrogações (18 interrogações) */}
              {questionsReduced.map((q, i) => (
                <QuestionIconFloating
                  key={`question-${i}`}
                  color={q.color}
                  width={q.width}
                  top={q.top}
                  left={q.left}
                  duration={q.duration}
                  delay={q.delay}
                  rotate={q.rotate}
                />
              ))}
            </div>
          </Box>

          <svg
            width="100%"
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              maxWidth: '100%',
              width: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <defs>
              {/* Gradiente simples para círculos */}
              <radialGradient id="circleGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f5f7fa" />
              </radialGradient>

              {/* Sombra simples */}
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.15" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <marker
                id="arrow"
                viewBox="0 0 12 12"
                markerWidth="6"
                markerHeight="6"
                refY="6"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M1,1 L11,6 L1,11"
                  fill="none"
                  stroke="#12263a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>

              {/* Gradiente para borda - cor primária da aplicação */}
              <linearGradient
                id="circleBorderGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ff2c19" />
                <stop offset="100%" stopColor="#e62816" />
              </linearGradient>

              {/* Gradiente para círculos bloqueados */}
              <linearGradient id="circleBlockedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#d1d5db" />
              </linearGradient>
            </defs>

            {/* Linhas de conexão */}
            {showConnections && (
              <>
                {Array.from({ length: groups }).map((_, groupIndex) => {
                  const startIndex = groupIndex * 3;

                  return [0, 1].map((offset) => {
                    const i = startIndex + offset;
                    const j = i + 1;

                    if (j >= total) return null;

                    const faseAtual = fasesOrdenadas[i];
                    const faseProx = fasesOrdenadas[j];

                    const pos1 = calcularPosicao(i);
                    const pos2Centro = calcularPosicao(j);

                    let pontoFinal: { x: number; y: number };
                    let curvaParaCima: boolean;

                    if (offset === 0) {
                      pontoFinal = {
                        x: pos2Centro.x - 60,
                        y: pos2Centro.y,
                      };
                      curvaParaCima = true;
                    } else {
                      pontoFinal = {
                        x: pos2Centro.x,
                        y: pos2Centro.y + circleRadius + 40,
                      };
                      curvaParaCima = false;
                    }

                    const d = calcularCurva(pos1, pontoFinal, curvaParaCima);
                    const statusProx = getStatusFase(faseProx);
                    const connectionColor = getConnectionColor(statusProx);

                    return (
                      <path
                        key={`line-${faseAtual.id}-${faseProx.id}`}
                        d={d}
                        fill="none"
                        stroke={connectionColor}
                        strokeWidth="2"
                        strokeDasharray={
                          statusProx === 'desbloqueada' ||
                          statusProx === 'finalizada'
                            ? '0'
                            : '8 4'
                        }
                        strokeLinecap="round"
                        markerEnd="url(#arrow)"
                        opacity="0.9"
                      />
                    );
                  });
                })}
              </>
            )}

            {/* Fases */}
            {fasesOrdenadas.map((fase, index) => {
              const pos = calcularPosicao(index);
              const status = getStatusFase(fase);
              const clicavel = podeClicarFase(fase);
              const opacity = status === 'bloqueada' ? 0.5 : 1;
              const { fill, stroke } = getCircleAppearance(status);

              return (
                <g key={fase.id}>
                  {/* Sombra de fundo */}
                  <circle
                    cx={pos.x + 1}
                    cy={pos.y + 1}
                    r={40}
                    fill="rgba(0,0,0,0.05)"
                    opacity={opacity * 0.3}
                  />

                  {/* Círculo principal */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={40}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3"
                    strokeDasharray={status === 'bloqueada' ? '8 6' : '0'}
                    opacity={opacity}
                    filter="url(#shadow)"
                    style={{
                      cursor: clicavel ? 'pointer' : 'default',
                      transition: 'all 0.25s ease',
                    }}
                    onClick={() =>
                      clicavel && onFaseClick && onFaseClick(fase.id)
                    }
                    onMouseEnter={(e) => {
                      if (clicavel) {
                        e.currentTarget.setAttribute('r', '42');
                        e.currentTarget.setAttribute('stroke-width', '3.5');
                        e.currentTarget.style.filter =
                          'drop-shadow(0 4px 12px rgba(255, 44, 25, 0.3))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('r', '40');
                      e.currentTarget.setAttribute('stroke-width', '3');
                      e.currentTarget.style.filter = 'url(#shadow)';
                    }}
                  />

                  {/* Número da fase */}
                  <text
                    x={pos.x}
                    y={pos.y + 10}
                    textAnchor="middle"
                    fontFamily='"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                    fontSize="28"
                    fontWeight="700"
                    fill={
                      status === 'bloqueada'
                        ? '#6b7280'
                        : status === 'finalizada'
                        ? '#14532d'
                        : '#011b49'
                    }
                    style={{
                      pointerEvents: 'none',
                      transition: 'all 0.25s ease-in-out',
                    }}
                  >
                    {fase.ordem}
                  </text>

                  {/* Título da fase */}
                  {fase.titulo && (
                    <g>
                      <rect
                        x={pos.x - 70}
                        y={pos.y + 50}
                        width="140"
                        height="24"
                        rx={2}
                        fill="#ffffff"
                        stroke="rgba(1, 27, 73, 0.1)"
                        strokeWidth="1"
                        style={{ pointerEvents: 'none' }}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 66}
                        textAnchor="middle"
                        fontFamily='"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                        fontSize="11"
                        fill={
                          status === 'bloqueada'
                            ? '#6b7280'
                            : status === 'finalizada'
                            ? '#14532d'
                            : '#011b49'
                        }
                        fontWeight="600"
                        style={{ pointerEvents: 'none' }}
                      >
                        {fase.titulo.length > 22
                          ? `${fase.titulo.substring(0, 22)}...`
                          : fase.titulo}
                      </text>
                    </g>
                  )}

                </g>
              );
            })}

          </svg>
        </Box>
      </Box>
    </Box>
  );
};

export default FasesTabuleiro;
