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
  const marginTop = -80; // controle do espaço SUPERIOR (linha do topo) - reduzido para aproximar do título

  const phaseStepY = 50;
  const circleRadius = 55;

  // Altura real de um grupo (do círculo mais baixo ao mais alto)
  const groupHeight = phaseStepY + 2 * circleRadius;

  // Espaço extra entre grupos
  const groupGap = 300;

  // Espaçamento vertical entre "fundos" dos grupos
  const rowGap = groupHeight + groupGap;

  const total = fasesOrdenadas.length;
  const groups = Math.ceil(total / cols);

  // Altura do SVG considerando:
  // - topo: marginTop
  // - grupos: (groups - 1) * rowGap + groupHeight
  // - rodapé: marginBottom
  const svgHeight =
    marginTop + groupHeight + rowGap * (groups - 1) + marginBottom;

  const calcularPosicao = (index: number) => {
    const groupIndex = Math.floor(index / cols);
    const indexInGroup = index % cols;

    const linhaInvertida = groupIndex % 2 === 1;

    // grupo normal: 0,1,2 -> esquerda, meio, direita
    // grupo invertido: 0,1,2 -> direita, meio, esquerda
    const posicaoHorizontal = linhaInvertida
      ? cols - 1 - indexInGroup
      : indexInGroup;

    // baseY do grupo (círculo de baixo)
    const baseY =
      marginTop + groupHeight + rowGap * (groups - 1 - groupIndex);

    let y: number;
    // 0 = baixo, 1 = meio, 2 = alto
    if (indexInGroup === 0) {
      y = baseY;
    } else if (indexInGroup === 1) {
      y = baseY - phaseStepY;
    } else {
      const y2 = baseY - phaseStepY;
      y = y2 - 2 * circleRadius;
    }

    // X base
    const xBase = marginX + posicaoHorizontal * colSpacing;
    let x = xBase;

    // Recuo horizontal para 2º e 3º elementos da linha
    // linha normal recua para a esquerda, linha invertida recua para a direita
    const deslocamento = 200;

    if (!linhaInvertida) {
      if (indexInGroup === 1) {
        x = xBase - deslocamento * 0.25;
      } else if (indexInGroup === 2) {
        x = xBase - deslocamento;
      }
    } else {
      if (indexInGroup === 1) {
        x = xBase + deslocamento * 0.25;
      } else if (indexInGroup === 2) {
        x = xBase + deslocamento;
      }
    }

    return { x, y };
  };

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
      // saída pela borda do círculo em 180 graus (lado esquerdo)
      const anguloSaida = Math.PI;
      pontoInicio = {
        x: pos1.x + Math.cos(anguloSaida) * circleRadius,
        y: pos1.y + Math.sin(anguloSaida) * circleRadius,
      };

      // entrada na borda inferior do círculo de cima
      pontoFim = {
        x: pos2.x,
        y: pos2.y + circleRadius,
      };
    } else {
      // caso normal: ponto na borda em direção ao outro círculo
      pontoInicio = calcularPontoNaBorda(pos1, pos2, circleRadius);
      pontoFim = calcularPontoNaBorda(pos2, pos1, circleRadius);
    }

    const dx = pontoFim.x - pontoInicio.x;
    const dy = pontoFim.y - pontoInicio.y;

    const amplitudeUp = 40;
    const amplitudeDown = 80;
    let c1x: number;
    let c2x: number;
    let controlY1: number;
    let controlY2: number;

    if (doCentroParaBaixo) {
      const midY = (pontoInicio.y + pontoFim.y) / 2;
      const fatorAltura = 0.9;
      controlY1 = midY + amplitudeDown * fatorAltura * 0.6;
      controlY2 = midY + amplitudeDown * fatorAltura;

      c1x = pontoInicio.x + dx * 0.2;
      c2x = pontoInicio.x + dx * 0.8;
    } else {
      const amplitude = curvaParaCima ? amplitudeUp : amplitudeDown;
      const midY = (pontoInicio.y + pontoFim.y) / 2;
      controlY1 = curvaParaCima ? midY - amplitude : midY + amplitude;
      controlY2 = controlY1;

      const phi = (1 + Math.sqrt(5)) / 2;
      const t1 = 1 / (phi * phi); // ≈ 0.382
      const t2 = 1 / phi; // ≈ 0.618

      c1x = pontoInicio.x + dx * t1;
      c2x = pontoInicio.x + dx * t2;
    }

    return `
      M ${pontoInicio.x} ${pontoInicio.y}
      C ${c1x} ${controlY1},
        ${c2x} ${controlY2},
        ${pontoFim.x} ${pontoFim.y}
    `;
  };

  // Curva específica para conexão ENTRE grupos em proporção áurea
  const calcularCurvaEntreGrupos = (
    p0: { x: number; y: number },
    centroDestino: { x: number; y: number },
    intensidadeCurvatura: number = 1.2
  ) => {
    const p1 = {
      x: centroDestino.x,
      y: centroDestino.y + circleRadius,
    };

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;

    const phi = (1 + Math.sqrt(5)) / 2;
    const t1 = 1 / (phi * phi); // ≈ 0.382
    const t2 = 1 / phi; // ≈ 0.618

    const c1x = p0.x + dx * t1;
    const c2x = p0.x + dx * t2;

    const baseY = Math.max(p0.y, p1.y);
    const amplitudeBase = groupGap * intensidadeCurvatura;
    // Ajuste aqui se quiser mais ou menos curvatura vertical
    const controlY = baseY + amplitudeBase - 440;

    const c1y = controlY;
    const c2y = controlY;

    return `
      M ${p0.x} ${p0.y}
      C ${c1x} ${c1y},
        ${c2x} ${c2y},
        ${p1.x} ${p1.y}
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

  const getConnectionColor = () => '#011b49';

  // Gerar formas geométricas aleatórias (valores estáveis)
  const shapes = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 30,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
    color: ['#2196F3', '#E62816', '#4CAF50', '#FFC107'][i % 4],
    rotate: Math.random() * 360,
  })), []);

  // Gerar partículas pequenas (valores estáveis)
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 8 + 10,
    delay: Math.random() * 5,
    color: ['#2196F3', '#E62816', '#4CAF50', '#FFC107', '#FF9800', '#9C27B0'][i % 6],
  })), []);

  // Configurações das interrogações com delays e durações aleatórias
  const questions = useMemo(() => [
    { color: "#2196F3", width: 100, top: "5%", left: "5%", rotate: -15 },
    { color: "#E62816", width: 120, top: "12%", left: "8%", rotate: 10 },
    { color: "#4CAF50", width: 110, top: "5%", left: "95%", rotate: 15 },
    { color: "#FFC107", width: 130, top: "10%", left: "92%", rotate: -12 },
    { color: "#E62816", width: 115, top: "95%", left: "5%", rotate: -8 },
    { color: "#2196F3", width: 105, top: "88%", left: "8%", rotate: 12 },
    { color: "#FFC107", width: 125, top: "95%", left: "95%", rotate: -10 },
    { color: "#4CAF50", width: 110, top: "90%", left: "92%", rotate: 8 },
    { color: "#E62816", width: 140, top: "3%", left: "50%", rotate: -5 },
    { color: "#2196F3", width: 135, top: "97%", left: "50%", rotate: 7 },
    { color: "#4CAF50", width: 120, top: "50%", left: "2%", rotate: -12 },
    { color: "#FFC107", width: 115, top: "50%", left: "98%", rotate: 14 },
    { color: "#2196F3", width: 100, top: "20%", left: "15%", rotate: -6 },
    { color: "#E62816", width: 110, top: "25%", left: "85%", rotate: 9 },
    { color: "#4CAF50", width: 105, top: "75%", left: "12%", rotate: -11 },
    { color: "#FFC107", width: 125, top: "80%", left: "88%", rotate: 13 },
    { color: "#2196F3", width: 95, top: "45%", left: "45%", rotate: -8 },
    { color: "#E62816", width: 110, top: "50%", left: "50%", rotate: 12 },
    { color: "#4CAF50", width: 100, top: "55%", left: "55%", rotate: -10 },
    { color: "#FFC107", width: 115, top: "48%", left: "52%", rotate: 8 },
    { color: "#2196F3", width: 90, top: "30%", left: "30%", rotate: -5 },
    { color: "#E62816", width: 105, top: "35%", left: "70%", rotate: 7 },
    { color: "#4CAF50", width: 100, top: "32%", left: "50%", rotate: -9 },
    { color: "#FFC107", width: 95, top: "65%", left: "30%", rotate: 6 },
    { color: "#2196F3", width: 110, top: "70%", left: "70%", rotate: -7 },
    { color: "#E62816", width: 105, top: "68%", left: "50%", rotate: 10 },
    { color: "#4CAF50", width: 100, top: "40%", left: "25%", rotate: -4 },
    { color: "#FFC107", width: 115, top: "60%", left: "75%", rotate: 9 },
    { color: "#2196F3", width: 90, top: "42%", left: "75%", rotate: -6 },
    { color: "#E62816", width: 105, top: "58%", left: "25%", rotate: 8 },
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
          width: '100%',
          maxWidth: '95%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          padding: 3,
          overflow: 'hidden',
        }}
      >
        {/* Background animado com elementos do AnimatedBackground */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            zIndex: 0,
            pointerEvents: 'none',
            filter: 'blur(4px)',
            opacity: 0.6,
          }}
          className="animated-background"
        >
          {/* Gradiente de fundo */}
          <Box
            className="bg-gradient"
            sx={{
              position: 'absolute',
              inset: 0,
            }}
          />
          
          {/* Formas geométricas flutuantes */}
          {shapes.map((shape) => (
            <Box
              key={`shape-${shape.id}`}
              className="floating-shape"
              sx={{
                position: 'absolute',
                width: `${shape.size}px`,
                height: `${shape.size}px`,
                top: `${shape.top}%`,
                left: `${shape.left}%`,
                backgroundColor: shape.color,
                animationDuration: `${shape.duration}s`,
                animationDelay: `${shape.delay}s`,
                transform: `rotate(${shape.rotate}deg)`,
              }}
            />
          ))}

          {/* Partículas pequenas */}
          {particles.map((particle) => (
            <Box
              key={`particle-${particle.id}`}
              className="floating-particle"
              sx={{
                position: 'absolute',
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                top: `${particle.top}%`,
                left: `${particle.left}%`,
                backgroundColor: particle.color,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}

          {/* Interrogações com delays e durações aleatórias */}
          {questions.map((q, i) => (
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
            <radialGradient id="circleGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f5f7fa" />
            </radialGradient>

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

            <linearGradient
              id="circleBlockedGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>

          {showConnections && (
            <>
              {/* conexões dentro de cada grupo */}
              {Array.from({ length: groups }).map((_, groupIndex) => {
                const startIndex = groupIndex * cols;

                return [0, 1].map((offset) => {
                  const i = startIndex + offset;
                  const j = i + 1;

                  if (j >= total) return null;

                  const faseAtual = fasesOrdenadas[i];
                  const faseProx = fasesOrdenadas[j];

                  const pos1 = calcularPosicao(i);
                  const pos2 = calcularPosicao(j);

                  const curvaParaCima = offset === 0;
                  const doCentroParaBaixo = offset === 1;

                  const d = calcularCurva(
                    pos1,
                    pos2,
                    curvaParaCima,
                    doCentroParaBaixo
                  );
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

              {/* conexões ENTRE grupos (linha normal -> linha invertida) */}
              {Array.from({ length: groups - 1 }).map((_, groupIndex) => {
                const ultimaFaseIndex = (groupIndex + 1) * cols - 1;
                const primeiraFaseProxIndex = (groupIndex + 1) * cols;

                if (ultimaFaseIndex >= total || primeiraFaseProxIndex >= total) {
                  return null;
                }

                const faseAtual = fasesOrdenadas[ultimaFaseIndex];
                const faseProx = fasesOrdenadas[primeiraFaseProxIndex];

                const posCentro1 = calcularPosicao(ultimaFaseIndex);
                const posCentro2 = calcularPosicao(primeiraFaseProxIndex);

                const pontoLateralInicioOriginal = calcularPontoNaBorda(
                  posCentro1,
                  posCentro2,
                  circleRadius
                );

                const ajusteAlturaSaida = 50;

                const pontoLateralInicio = {
                  ...pontoLateralInicioOriginal,
                  y: pontoLateralInicioOriginal.y + ajusteAlturaSaida,
                };

                const d = calcularCurvaEntreGrupos(
                  pontoLateralInicio,
                  posCentro2
                );

                const connectionColor = getConnectionColor();

                return (
                  <path
                    key={`line-group-${faseAtual.id}-${faseProx.id}`}
                    d={d}
                    fill="none"
                    stroke={connectionColor}
                    strokeWidth="4"
                    strokeDasharray="12 6"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                );
              })}
            </>
          )}

          {fasesOrdenadas.map((fase, index) => {
            const pos = calcularPosicao(index);
            const status = getStatusFase(fase);
            const clicavel = podeClicarFase(fase);
            const opacity = status === 'bloqueada' ? 0.5 : 1;
            const { fill, stroke } = getCircleAppearance(status);

            return (
              <g key={fase.id}>
                <circle
                  cx={pos.x + 1}
                  cy={pos.y + 1}
                  r={circleRadius}
                  fill="rgba(0,0,0,0.05)"
                  opacity={opacity * 0.3}
                />

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
                  onClick={() => clicavel && onFaseClick && onFaseClick(fase.id)}
                  onMouseEnter={(e) => {
                    if (clicavel) {
                      e.currentTarget.setAttribute(
                        'r',
                        String(circleRadius + 2)
                      );
                      e.currentTarget.setAttribute('stroke-width', '3.5');
                      (e.currentTarget as SVGCircleElement).style.filter =
                        'drop-shadow(0 4px 12px rgba(255, 44, 25, 0.3))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.setAttribute('r', String(circleRadius));
                    e.currentTarget.setAttribute('stroke-width', '3');
                    (e.currentTarget as SVGCircleElement).style.filter =
                      'url(#shadow)';
                  }}
                />

                {status !== 'bloqueada' && (
                  <text
                    x={pos.x}
                    y={pos.y + 12}
                    textAnchor="middle"
                    fontFamily='"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                    fontSize="32"
                    fontWeight="700"
                    fill={status === 'finalizada' ? '#14532d' : '#011b49'}
                    style={{
                      pointerEvents: 'none',
                      transition: 'all 0.25s ease-in-out',
                    }}
                  >
                    {fase.ordem}
                  </text>
                )}

                {status === 'bloqueada' && (
                  <g>
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
                    <path
                      d={`M ${pos.x - 14} ${pos.y - 2}
                          Q ${pos.x} ${pos.y - 12} ${pos.x + 14} ${pos.y - 2}`}
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{ pointerEvents: 'none' }}
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y + 6}
                      r="3"
                      fill="#ffffff"
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                )}

                {status === 'desbloqueada' && !fase.finalizada && (
                  <g>
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

                {fase.titulo && (
                  <g>
                    <rect
                      x={pos.x - 90}
                      y={pos.y + circleRadius + 10}
                      width="180"
                      height="28"
                      rx="2"
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
