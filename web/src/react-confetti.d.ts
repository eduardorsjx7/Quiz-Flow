declare module 'react-confetti' {
  import { CSSProperties } from 'react';

  export interface ConfettiProps {
    /**
     * Width of the canvas
     */
    width?: number;
    /**
     * Height of the canvas
     */
    height?: number;
    /**
     * Number of confetti pieces
     */
    numberOfPieces?: number;
    /**
     * Friction of confetti
     */
    friction?: number;
    /**
     * Wind force
     */
    wind?: number;
    /**
     * Gravity force
     */
    gravity?: number;
    /**
     * Initial velocity in Y direction
     */
    initialVelocityY?: number;
    /**
     * Initial velocity in X direction
     */
    initialVelocityX?: number;
    /**
     * Array of colors to use for confetti
     */
    colors?: string[];
    /**
     * Opacity of confetti
     */
    opacity?: number;
    /**
     * Whether to recycle confetti after it falls
     */
    recycle?: boolean;
    /**
     * Run the confetti animation
     */
    run?: boolean;
    /**
     * Tween duration in milliseconds
     */
    tweenDuration?: number;
    /**
     * Additional confetti config
     */
    confettiSource?: {
      x?: number;
      y?: number;
      w?: number;
      h?: number;
    };
    /**
     * Drawing context function
     */
    drawShape?: (context: CanvasRenderingContext2D) => void;
    /**
     * Callback when animation completes
     */
    onConfettiComplete?: (confetti: any) => void;
    /**
     * Style object for canvas
     */
    style?: CSSProperties;
    /**
     * Class name for canvas
     */
    className?: string;
  }

  const Confetti: React.FC<ConfettiProps>;
  export default Confetti;
}

