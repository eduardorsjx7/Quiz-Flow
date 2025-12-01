import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon, Lock as LockIcon, CheckCircle as CheckCircleIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { QuestionIconFloating } from './QuestionIconFloating';
import './animated-background.css';

interface FaseTabuleiro {
  id: number;
  ordem: number;
  titulo: string;
  desbloqueada?: boolean;
  finalizada?: boolean;
  aguardandoDesbloqueio?: boolean;
  ativo?: boolean;
}

interface FasesTabuleiroProps {
  fases: FaseTabuleiro[];
  onFaseClick?: (faseId: number) => void;
  isAdmin?: boolean;
  showConnections?: boolean;
  onEditFase?: (faseId: number) => void;
  onDeleteFase?: (faseId: number) => void;
}

const FasesTabuleiro: React.FC<FasesTabuleiroProps> = ({
  fases,
  onFaseClick,
  isAdmin = false,
  showConnections = true,
  onEditFase,
  onDeleteFase,
}) => {
  const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);

  const cols = 3;
  const svgWidth = 1200;
  const marginX = 120;
  const colSpacing = (svgWidth - marginX * 2) / (cols - 1);

  // Margem padrão entre bordas e círculos
  const margemPadrao = 0;
  const phaseStepY = 0;
  const circleRadius = 55;
  
  // Altura real de um grupo (do círculo mais baixo ao mais alto)
  const groupHeight = phaseStepY + 2 * circleRadius;

  // Espaço extra entre grupos
  const groupGap = 300;

  // Espaçamento vertical entre "fundos" dos grupos
  

  const total = fasesOrdenadas.length;

  const rowGap = total === 1 ? 0 : groupHeight + groupGap;

  const groups = Math.ceil(total / cols);

  // Recalcular Y e encontrar o círculo mais alto e mais baixo em um único loop
  // Função auxiliar movida para dentro do useMemo para evitar problemas de dependências
  const { posicaoYCirculoMaisAlto, posicaoYCirculoMaisBaixo } = useMemo(() => {
    // Função auxiliar otimizada para calcular Y de cada círculo individualmente
    // Usa EXATAMENTE a mesma lógica de calcularPosicao, mas sem marginTop
    const calcularY = (index: number) => {
      const groupIndex = Math.floor(index / cols);
      const indexInGroup = index % cols;
    
      // Calcular a posição relativa do grupo, mas se houver apenas um elemento, ajustamos para a posição esperada
      const baseYRelativa = groupHeight + rowGap * (groups - 1 - groupIndex);
    
      if (total === 1) {
        // Se houver apenas um elemento, ajusta a baseYRelativa para garantir que o círculo fique na posição certa
        return baseYRelativa;
      }
    
      // Lógica normal de cálculo de Y
      if (indexInGroup === 0) {
        return baseYRelativa;
      } else if (indexInGroup === 1) {
        return baseYRelativa - phaseStepY;
      } else {
        const y2 = baseYRelativa - phaseStepY;
        return y2 - 2 * circleRadius;
      }
    };

    // Inicializar as variáveis para calcular o círculo mais alto e mais baixo
    let menorY = calcularY(0);  // Calcular o Y do primeiro círculo para inicializar
    let maiorY = menorY;

    // Loop otimizado: calcular Y e encontrar menor/maior Y (círculo mais alto/baixo) em uma única iteração
    for (let i = 1; i < total; i++) {
      const y = calcularY(i);
      
      // Atualizar o círculo mais alto (menor Y)
      if (y < menorY) {
        menorY = y;
      }
      // Atualizar o círculo mais baixo (maior Y)
      if (y > maiorY) {
        maiorY = y;
      }
    }

    return {
      posicaoYCirculoMaisAlto: menorY,
      posicaoYCirculoMaisBaixo: maiorY,
    };
  }, [total, groupHeight, phaseStepY, circleRadius, cols, groups, rowGap]);

  // Calculando o topo e fundo com base nos círculos mais alto e mais baixo
  // topoCirculoMaisAlto = posição do topo do círculo mais alto (sem marginTop)
  // Quando aplicamos marginTop, o topo final será: marginTop + topoCirculoMaisAlto
  const topoCirculoMaisAlto = posicaoYCirculoMaisAlto - circleRadius;
  const fundoCirculoMaisBaixo = posicaoYCirculoMaisBaixo + circleRadius;

  // Calcular marginTop para garantir que o topo do círculo mais alto fique exatamente na margem padrão
  // A posição final do topo do círculo será: marginTop + topoCirculoMaisAlto
  // Queremos que isso seja igual a margemPadrao: marginTop + topoCirculoMaisAlto = margemPadrao
  // Portanto: marginTop = margemPadrao - topoCirculoMaisAlto
  const marginTop = useMemo(() => {
    if (total === 1) {
      // Para um único círculo, garantir que fique na margem padrão
      const topoUnico = posicaoYCirculoMaisAlto - circleRadius;
      return margemPadrao - topoUnico;
    }
    // marginTop deve garantir que o topo do círculo mais alto fique exatamente em margemPadrao
    // Exemplo: se topoCirculoMaisAlto = -50 e margemPadrao = 0, então marginTop = 0 - (-50) = 50
    // O topo final será: 50 + (-50) = 0 (exatamente na margem padrão)
    return margemPadrao - topoCirculoMaisAlto;
  }, [topoCirculoMaisAlto, margemPadrao, total, posicaoYCirculoMaisAlto, circleRadius]);

  // Calcular altura do SVG garantindo margens iguais superior e inferior
  // Altura = marginTop + (distância do topo do círculo mais alto ao fundo do círculo mais baixo) + margem inferior + espaço para label
  // A margem inferior deve ser igual à margem superior (margemPadrao)
  const svgHeight = useMemo(() => {
    const espacoLabel = circleRadius + 10 + 28;
    const alturaEntreCirculos = total > 0 
      ? (fundoCirculoMaisBaixo - topoCirculoMaisAlto)
      : 0;
    
    // marginTop já garante a margem superior
    // Adicionamos margemPadrao para garantir a margem inferior igual
    const alturaCalculada = marginTop + alturaEntreCirculos + margemPadrao + espacoLabel;
    
    return Math.max(200, alturaCalculada); // altura mínima de 200px
  }, [marginTop, topoCirculoMaisAlto, fundoCirculoMaisBaixo, total, circleRadius, margemPadrao]);
  

  const calcularPosicao = (index: number) => {
    const groupIndex = Math.floor(index / cols);
    const indexInGroup = index % cols;

    const linhaInvertida = groupIndex % 2 === 1;

    // grupo normal: 0,1,2 -> esquerda, meio, direita
    // grupo invertido: 0,1,2 -> direita, meio, esquerda
    const posicaoHorizontal = linhaInvertida
      ? cols - 1 - indexInGroup
      : indexInGroup;

    // baseY do grupo (círculo de baixo) - usar posição relativa + marginTop
    const baseYRelativa = groupHeight + rowGap * (groups - 1 - groupIndex);
    const baseY = marginTop + baseYRelativa;

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
    // Ordem de prioridade: finalizada > aguardando > desbloqueada > bloqueada
    // O backend já calcula tudo corretamente, apenas usar os valores
    if (fase.finalizada) return 'finalizada';
    if (fase.aguardandoDesbloqueio) return 'aguardando';
    if (fase.desbloqueada) return 'desbloqueada';
    return 'bloqueada'; // Default: se não está desbloqueada, finalizada ou aguardando, está bloqueada
  };

  const podeClicarFase = (fase: FaseTabuleiro) =>
    fase.desbloqueada && !fase.finalizada && fase.ativo;

  const getCircleAppearance = (status: string) => {
    if (status === 'bloqueada') {
      return {
        fill: 'url(#circleBlockedGradient)',
        stroke: 'url(#circleBlockedGradient)',
      };
    }
    if (status === 'aguardando') {
      return {
        fill: '#ffffff',
        stroke: 'url(#circleBorderGradient)',
      };
    }
    if (status === 'finalizada') {
      return {
        fill: '#ffffff',
        stroke: 'url(#circleBorderGradient)',
      };
    }
    return {
      fill: '#ffffff',
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

            <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
            
            <filter id="redOverlay" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>

            {/* Filtro de brilho para ícone de bloqueio */}
            <filter id="glowRed" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Filtro de brilho para ícone de finalizada */}
            <filter id="glowGreen" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Gradiente radial para aura de finalizada */}
            <radialGradient id="checkAuraGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.6)" />
              <stop offset="50%" stopColor="rgba(34, 197, 94, 0.3)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
            </radialGradient>

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
            const { fill, stroke } = getCircleAppearance(status);

            return (
              <g key={fase.id}>
                {/* Definir clipPath para limitar blur apenas dentro do círculo */}
                <defs>
                  <clipPath id={`circleClip-${fase.id}`}>
                    <circle cx={pos.x} cy={pos.y} r={circleRadius} />
                  </clipPath>
                </defs>

                {/* Círculo de sombra de fundo - sem efeitos */}
                <circle
                  cx={pos.x + 1}
                  cy={pos.y + 1}
                  r={circleRadius}
                  fill="rgba(0,0,0,0.05)"
                  opacity={0.3}
                />

                {/* Círculo principal - 100% de opacidade, sem blur - na frente das linhas */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={circleRadius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="3"
                  strokeDasharray={status === 'bloqueada' ? '8 6' : '0'}
                  opacity={1}
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

                {/* Efeito de overlay vermelho sólido quando bloqueada */}
                {status === 'bloqueada' && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={circleRadius}
                    fill="rgba(227, 12, 12, 0.75)"
                    style={{ 
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Efeito de overlay verde sólido quando finalizada */}
                {status === 'finalizada' && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={circleRadius}
                    fill="rgba(14, 222, 90, 0.85)"
                    style={{ 
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Efeito de overlay amarelo sólido quando aguardando desbloqueio */}
                {status === 'aguardando' && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={circleRadius}
                    fill="rgba(255, 193, 7, 0.75)"
                    style={{ 
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Número da fase - 100% de opacidade, sem blur - não aparece quando bloqueada ou aguardando */}
                {status !== 'bloqueada' && status !== 'aguardando' && (
                  <text
                    x={pos.x}
                    y={pos.y + 12}
                    textAnchor="middle"
                    fontFamily='"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                    fontSize="32"
                    fontWeight="700"
                    fill={status === 'finalizada' ? '#14532d' : '#011b49'}
                    opacity={1}
                    style={{
                      pointerEvents: 'none',
                      transition: 'all 0.25s ease-in-out',
                    }}
                  >
                    {fase.ordem}
                  </text>
                )}

                {/* Círculo pulsante - aparece sempre que não está finalizada */}
                {!fase.finalizada && (
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

                {isAdmin && (
                  <g>
                    {/* Círculo de Editar */}
                    <circle
                      cx={pos.x - 20}
                      cy={pos.y + circleRadius + 65}
                      r="16"
                      fill="#2196F3"
                      stroke="#1976D2"
                      strokeWidth="2"
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={(e: React.MouseEvent<SVGCircleElement>) => {
                        e.stopPropagation();
                        if (onEditFase) {
                          onEditFase(fase.id);
                        }
                      }}
                      onMouseEnter={(e: React.MouseEvent<SVGCircleElement>) => {
                        e.currentTarget.setAttribute('r', '18');
                        e.currentTarget.setAttribute('fill', '#1976D2');
                      }}
                      onMouseLeave={(e: React.MouseEvent<SVGCircleElement>) => {
                        e.currentTarget.setAttribute('r', '16');
                        e.currentTarget.setAttribute('fill', '#2196F3');
                      }}
                    />
                    <foreignObject
                      x={pos.x - 30}
                      y={pos.y + circleRadius + 55}
                      width="20"
                      height="20"
                      style={{ pointerEvents: 'none' }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          color: '#ffffff',
                        }}
                      >
                        <EditIcon sx={{ fontSize: '18px' }} />
                      </Box>
                    </foreignObject>

                    {/* Círculo de Excluir */}
                    <circle
                      cx={pos.x + 20}
                      cy={pos.y + circleRadius + 65}
                      r="16"
                      fill="#f44336"
                      stroke="#d32f2f"
                      strokeWidth="2"
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={(e: React.MouseEvent<SVGCircleElement>) => {
                        e.stopPropagation();
                        if (onDeleteFase) {
                          onDeleteFase(fase.id);
                        }
                      }}
                      onMouseEnter={(e: React.MouseEvent<SVGCircleElement>) => {
                        e.currentTarget.setAttribute('r', '18');
                        e.currentTarget.setAttribute('fill', '#d32f2f');
                      }}
                      onMouseLeave={(e: React.MouseEvent<SVGCircleElement>) => {
                        e.currentTarget.setAttribute('r', '16');
                        e.currentTarget.setAttribute('fill', '#f44336');
                      }}
                    />
                    <foreignObject
                      x={pos.x + 10}
                      y={pos.y + circleRadius + 55}
                      width="20"
                      height="20"
                      style={{ pointerEvents: 'none' }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          color: '#ffffff',
                        }}
                      >
                        <CloseIcon sx={{ fontSize: '18px' }} />
                      </Box>
                    </foreignObject>
                  </g>
                )}

                {/* Ícone de cadeado - aparece por cima de tudo quando bloqueada */}
                {status === 'bloqueada' && (
                  <foreignObject
                    x={pos.x - 18}
                    y={pos.y - 18}
                    width="36"
                    height="36"
                    style={{ 
                      pointerEvents: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LockIcon 
                        sx={{ 
                          fontSize: '36px',
                          color: '#ffffff',
                        }} 
                      />
                    </Box>
                  </foreignObject>
                )}

                {/* Ícone de relógio - aparece por cima de tudo quando aguardando desbloqueio */}
                {status === 'aguardando' && (
                  <foreignObject
                    x={pos.x - 18}
                    y={pos.y - 18}
                    width="36"
                    height="36"
                    style={{ 
                      pointerEvents: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ScheduleIcon 
                        sx={{ 
                          fontSize: '36px',
                          color: '#ffffff',
                        }} 
                      />
                    </Box>
                  </foreignObject>
                )}

                {/* Ícone de check com efeito melhorado - aparece por cima de tudo quando finalizada */}
                {status === 'finalizada' && (
                  <g>
                    {/* Aura pulsante ao redor do ícone */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="28"
                      fill="url(#checkAuraGradient)"
                      style={{ pointerEvents: 'none' }}
                    >
                      <animate
                        attributeName="r"
                        values="28;35;28"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0.7;0.4"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="24"
                      fill="url(#checkAuraGradient)"
                      style={{ pointerEvents: 'none' }}
                    >
                      <animate
                        attributeName="r"
                        values="24;30;24"
                        dur="2.5s"
                        repeatCount="indefinite"
                        begin="0.4s"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.5;0.8;0.5"
                        dur="2.5s"
                        repeatCount="indefinite"
                        begin="0.4s"
                      />
                    </circle>
                    
                    {/* Círculo de fundo com gradiente para o ícone */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="20"
                      fill="rgba(34, 197, 94, 0.15)"
                      style={{ pointerEvents: 'none' }}
                    />
                    
                    {/* Ícone de check com efeitos visuais aprimorados */}
                    <foreignObject
                      x={pos.x - 18}
                      y={pos.y - 18}
                      width="36"
                      height="36"
                      style={{ 
                        pointerEvents: 'none',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'scale(1)',
                          transition: 'all 0.3s ease-in-out',
                          animation: 'iconGlow 2.5s ease-in-out infinite',
                          '@keyframes iconGlow': {
                            '0%, 100%': {
                              transform: 'scale(1)',
                              opacity: 0.95,
                            },
                            '50%': {
                              transform: 'scale(1.08)',
                              opacity: 1,
                            },
                          },
                        }}
                      >
                        <CheckCircleIcon 
                          sx={{ 
                            fontSize: '36px',
                            color: '#ffffff',
                            filter: 'drop-shadow(0 3px 8px rgba(34, 197, 94, 0.6)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5))',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                          }} 
                        />
                      </Box>
                    </foreignObject>
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
