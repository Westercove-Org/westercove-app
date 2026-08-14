import Svg, { Defs, Mask, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * The "living light" treatment that sits over every hero photo: a fan of soft
 * sun rays from an off-screen sun, plus a warm radial glow beneath them. Both
 * are masked so they fade out before reaching the text, keeping headlines
 * legible over the photo.
 *
 * The demo builds this in CSS (`header-rays` / `hero-rays` + `hero-lighten`);
 * there is no conic-gradient or CSS mask in React Native, so the ray fan is
 * drawn as discrete polygons and the fade is a radial-gradient mask.
 */
export interface SunGlowProps {
  /** Sun position as a fraction of width/height. Headers put it upper-right,
   *  the launch screen puts it top-center. */
  originX?: number;
  originY?: number;
  /** How far the glow and rays reach, as a fraction of the box. */
  spread?: number;
  /** Peak ray opacity at the sun. */
  intensity?: number;
  /** Peak opacity of the warm glow at the sun. Keep this low over a photo that
   *  is already bright, or the landscape washes out to pale pink. */
  glowOpacity?: number;
}

/** Ray geometry, in the 0..100 user-space the Svg viewBox defines. */
const RAY_COUNT = 22;
const RAY_HALF_WIDTH = 0.9; // degrees
const RAY_STEP = 360 / RAY_COUNT;
const RAY_LENGTH = 200;

function rayPoints(originX: number, originY: number, index: number): string {
  const center = index * RAY_STEP;
  const toPoint = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${originX + Math.cos(rad) * RAY_LENGTH},${originY + Math.sin(rad) * RAY_LENGTH}`;
  };
  return `${originX},${originY} ${toPoint(center - RAY_HALF_WIDTH)} ${toPoint(center + RAY_HALF_WIDTH)}`;
}

export function SunGlow({
  originX = 0.82,
  originY = -0.08,
  spread = 0.9,
  intensity = 0.18,
  glowOpacity = 0.3,
}: SunGlowProps) {
  const ox = originX * 100;
  const oy = originY * 100;
  const radius = spread * 100;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        {/* Fades the ray fan out with distance from the sun. */}
        <RadialGradient id="rayFade" cx={ox} cy={oy} r={radius} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#fff" stopOpacity="1" />
          <Stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
        <Mask id="rayMask">
          <Rect x="0" y="0" width="100" height="100" fill="url(#rayFade)" />
        </Mask>
        {/* The warm glow itself, sitting under the rays. */}
        <RadialGradient id="glow" cx={ox} cy={oy} r={radius} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFF5DA" stopOpacity={glowOpacity} />
          <Stop offset="0.62" stopColor="#FFF5DA" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect x="0" y="0" width="100" height="100" fill="url(#glow)" />

      {Array.from({ length: RAY_COUNT }, (_, i) => (
        <Polygon
          key={i}
          points={rayPoints(ox, oy, i)}
          fill="#FFFAE8"
          fillOpacity={intensity}
          mask="url(#rayMask)"
        />
      ))}
    </Svg>
  );
}
