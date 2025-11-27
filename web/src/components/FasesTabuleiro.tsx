import React from 'react';
import { Box } from '@mui/material';

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

  const phaseStepY = 50;
  const circleRadius = 55;

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

  // Calcula o ponto na borda do círculo baseado no ângulo
  const calcularPontoNaBorda = (
    centro: { x: number; y: number },
    outroPonto: { x: number; y: number },
    raio: number
  ) => {
    const dx = outroPonto.x - centro.x;
    const dy = outroPonto.y - centro.y;
    const angulo = Math.atan2(dy, dx);
    
    return {
      x: centro.x + Math.cos(angulo) * raio,
      y: centro.y + Math.sin(angulo) * raio,
    };
  };

  const calcularCurva = (
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
    curvaParaCima: boolean,
    doCentroParaBaixo: boolean = false
  ) => {
    let pontoInicio: { x: number; y: number };
    let pontoFim: { x: number; y: number };

    if (doCentroParaBaixo) {
      // Começa do centro da fase 1 e termina na parte inferior da fase 2
      pontoInicio = pos1; // Centro
      pontoFim = {
        x: pos2.x,
        y: pos2.y + circleRadius, // Parte inferior do círculo
      };
    } else {
      // Calcular pontos na borda dos círculos
      pontoInicio = calcularPontoNaBorda(pos1, pos2, circleRadius);
      pontoFim = calcularPontoNaBorda(pos2, pos1, circleRadius);
    }

    const dx = pontoFim.x - pontoInicio.x;

    let amplitudeUp = 40;
    let amplitudeDown = 80;
    let c1x: number;
    let c2x: number;
    let controlY1: number;
    let controlY2: number;

    if (doCentroParaBaixo) {
      // Curva mais acentuada no final, direcionando para a direita
      amplitudeDown = 100;
      const midY = (pontoInicio.y + pontoFim.y) / 2;
      controlY1 = midY + amplitudeDown * 0.6;
      controlY2 = midY + amplitudeDown;
      
      // Segundo ponto de controle mais próximo do final e mais à direita
      c1x = pontoInicio.x + dx * 0.3;
      c2x = pontoInicio.x + dx * 0.85; // Mais próximo do final
    } else {
      const amplitude = curvaParaCima ? amplitudeUp : amplitudeDown;
      const midY = (pontoInicio.y + pontoFim.y) / 2;
      controlY1 = curvaParaCima ? midY - amplitude : midY + amplitude;
      controlY2 = controlY1;
      
      c1x = pontoInicio.x + dx * 0.25;
      c2x = pontoInicio.x + dx * 0.75;
    }

    return `
      M ${pontoInicio.x} ${pontoInicio.y}
      C ${c1x} ${controlY1},
        ${c2x} ${controlY2},
        ${pontoFim.x} ${pontoFim.y}
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

  const getConnectionColor = () => {
    return '#011b49'; // Cor azul escura da aplicação
  };

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
          width: '100%',
          maxWidth: '95%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
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
                    const pos2 = calcularPosicao(j);

                    const curvaParaCima = offset === 0;
                    // Para a conexão 2->3 (offset === 1), sair do centro e terminar na parte inferior
                    const doCentroParaBaixo = offset === 1;

                    const d = calcularCurva(pos1, pos2, curvaParaCima, doCentroParaBaixo);
                    const connectionColor = getConnectionColor();

                    return (
                      <path
                        key={`line-${faseAtual.id}-${faseProx.id}`}
                        d={d}
                        fill="none"
                        stroke={connectionColor}
                        strokeWidth="4"
                        strokeDasharray="12 6"
                        strokeLinecap="round"
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
                    r={circleRadius}
                    fill="rgba(0,0,0,0.05)"
                    opacity={opacity * 0.3}
                  />

                  {/* Círculo principal */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={circleRadius}
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
                        e.currentTarget.setAttribute('r', String(circleRadius + 2));
                        e.currentTarget.setAttribute('stroke-width', '3.5');
                        e.currentTarget.style.filter =
                          'drop-shadow(0 4px 12px rgba(255, 44, 25, 0.3))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('r', String(circleRadius));
                      e.currentTarget.setAttribute('stroke-width', '3');
                      e.currentTarget.style.filter = 'url(#shadow)';
                    }}
                  />

                  {/* Número da fase - oculto se bloqueada (mostra cadeado) */}
                  {status !== 'bloqueada' && (
                    <text
                      x={pos.x}
                      y={pos.y + 12}
                      textAnchor="middle"
                      fontFamily='"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                      fontSize="32"
                      fontWeight="700"
                      fill={
                        status === 'finalizada'
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
                  )}

                  {/* Efeito de cadeado para fases bloqueadas/fechadas */}
                  {status === 'bloqueada' && (
                    <g>
                      {/* Corpo do cadeado */}
                      <rect
                        x={pos.x - 14}
                        y={pos.y - 2}
                        width="28"
                        height="20"
                        rx="3"
                        fill="#6b7280"
                        stroke="#4b5563"
                        strokeWidth="1.5"
                        style={{ pointerEvents: 'none' }}
                      />
                      {/* Arco do cadeado */}
                      <path
                        d={`M ${pos.x - 14} ${pos.y - 2}
                            Q ${pos.x} ${pos.y - 12} ${pos.x + 14} ${pos.y - 2}`}
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{ pointerEvents: 'none' }}
                      />
                      {/* Furo da fechadura */}
                      <circle
                        cx={pos.x}
                        cy={pos.y + 6}
                        r="3"
                        fill="#ffffff"
                        style={{ pointerEvents: 'none' }}
                      />
                    </g>
                  )}

                  {/* Efeito para fases que vão abrir (desbloqueadas mas não finalizadas) */}
                  {status === 'desbloqueada' && !fase.finalizada && (
                    <g>
                      {/* Círculo pulsante ao redor - primeiro */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={circleRadius + 8}
                        fill="none"
                        stroke="#ff2c19"
                        strokeWidth="2"
                        style={{ pointerEvents: 'none' }}
                      >
                        <animate
                          attributeName="opacity"
                          values="0.3;0.7;0.3"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="r"
                          values={`${circleRadius + 8};${circleRadius + 12};${circleRadius + 8}`}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      {/* Círculo pulsante ao redor - segundo (delay) */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={circleRadius + 4}
                        fill="none"
                        stroke="#ff2c19"
                        strokeWidth="2"
                        style={{ pointerEvents: 'none' }}
                      >
                        <animate
                          attributeName="opacity"
                          values="0.5;0.8;0.5"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.5s"
                        />
                        <animate
                          attributeName="r"
                          values={`${circleRadius + 4};${circleRadius + 8};${circleRadius + 4}`}
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.5s"
                        />
                      </circle>
                    </g>
                  )}

                  {/* Título da fase */}
                  {fase.titulo && (
                    <g>
                      <rect
                        x={pos.x - 90}
                        y={pos.y + circleRadius + 10}
                        width="180"
                        height="28"
                        rx={2}
                        fill="#ffffff"
                        stroke="rgba(1, 27, 73, 0.1)"
                        strokeWidth="1"
                        style={{ pointerEvents: 'none' }}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + circleRadius + 28}
                        textAnchor="middle"
                        fontFamily='"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                        fontSize="14"
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
                        {fase.titulo.length > 25
                          ? `${fase.titulo.substring(0, 25)}...`
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
  );
};

export default FasesTabuleiro;
