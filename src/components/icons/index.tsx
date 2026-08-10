import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Westercove line-icon set. 24pt box, 2pt stroke, round caps/joins per the
 * Design System §5. Profile uses a leaf and Support a heart rather than a
 * human figure, per the brand rule.
 */
export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function Base({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 10.5 L12 4 L20 10.5 V19 A1 1 0 0 1 19 20 H5 A1 1 0 0 1 4 19 Z" />
      <Path d="M10 20 V14 H14 V20" />
    </Base>
  );
}

export function JournalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M6 3 H17 A2 2 0 0 1 19 5 V21 H6 A1 1 0 0 1 5 20 V4 A1 1 0 0 1 6 3 Z" />
      <Path d="M8 8 H16 M8 12 H16 M8 16 H13" />
    </Base>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M15.6 8.4 L11 11 L8.4 15.6 L13 13 Z" />
    </Base>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M5 19 C5 10.7 11 5 19 5 C19 13.3 13 19 5 19 Z" />
      <Path d="M5.5 18.5 C9 15 13 11 16.5 8.5" />
    </Base>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M12 20 C12 20 4 15.2 4 9.2 A4 4 0 0 1 12 7 A4 4 0 0 1 20 9.2 C20 15.2 12 20 12 20 Z" />
    </Base>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Rect x={9} y={3} width={6} height={11} rx={3} />
      <Path d="M6 11 A6 6 0 0 0 18 11" />
      <Path d="M12 17 V21 M9 21 H15" />
    </Base>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4.5 11.5 L19.5 4.5 L13 19.5 L11 13 Z" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20 L16 16" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M9 6 L15 12 L9 18" />
    </Base>
  );
}

export function PadlockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Rect x={5} y={11} width={14} height={9} rx={2} />
      <Path d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
    </Base>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 20 L4.2 16 L15.5 4.7 A1.8 1.8 0 0 1 18 4.7 L19.3 6 A1.8 1.8 0 0 1 19.3 8.5 L8 19.8 Z" />
      <Path d="M14 6 L18 10" />
    </Base>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M5 4 H9 L11 9 L8.5 11 A11 11 0 0 0 13 15.5 L15 13 L20 15 V19 A2 2 0 0 1 18 21 A16 16 0 0 1 3 6 A2 2 0 0 1 5 4 Z" />
    </Base>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 5 H20 A1 1 0 0 1 21 6 V15 A1 1 0 0 1 20 16 H9 L5 20 V16 A1 1 0 0 1 4 15 Z" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M12 5 V19 M5 12 H19" />
    </Base>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M7 5 L19 12 L7 19 Z" />
    </Base>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M8 5 V19 M16 5 V19" />
    </Base>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M12 4 V15 M7 10.5 L12 15.5 L17 10.5 M5 20 H19" />
    </Base>
  );
}

export function PaperclipIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M20 11.5 L11.5 20 A4.5 4.5 0 0 1 5 13.5 L13 5.5 A3 3 0 0 1 17.5 9.7 L9.7 17.5 A1.5 1.5 0 0 1 7.5 15.4 L15 8" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M5 12.5 L10 17.5 L19 6.5" />
    </Base>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 7 H20 M9 7 V5 A1 1 0 0 1 10 4 H14 A1 1 0 0 1 15 5 V7 M6 7 L7 20 A1 1 0 0 0 8 21 H16 A1 1 0 0 0 17 20 L18 7" />
    </Base>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20 C 4 15.5 8 14 12 14 C 16 14 20 15.5 20 20" />
    </Base>
  );
}

export function LifeBuoyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="4" />
      <Path d="M4.93 4.93 L9.17 9.17 M14.83 14.83 L19.07 19.07 M14.83 9.17 L19.07 4.93 M9.17 14.83 L4.93 19.07" />
    </Base>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M2 12 C 5 6 9 4.5 12 4.5 C 15 4.5 19 6 22 12 C 19 18 15 19.5 12 19.5 C 9 19.5 5 18 2 12 Z" />
      <Circle cx="12" cy="12" r="3" />
    </Base>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 4 H12 A3 3 0 0 1 15 7 V20 A2 2 0 0 0 13 18 H4 Z" />
      <Path d="M20 4 H12" />
      <Path d="M8 8.5 H11 M8 12 H11" />
    </Base>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M12 3 L21 8 L12 13 L3 8 Z" />
      <Path d="M3 12 L12 17 L21 12" />
      <Path d="M3 16 L12 21 L21 16" />
    </Base>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M12 3 C12 7.5 13.5 9 18 9 C13.5 9 12 10.5 12 15 C12 10.5 10.5 9 6 9 C10.5 9 12 7.5 12 3 Z" />
      <Path d="M18 15 C18 17.2 18.8 18 21 18 C18.8 18 18 18.8 18 21 C18 18.8 17.2 18 15 18 C17.2 18 18 17.2 18 15 Z" />
    </Base>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M6 3 H14 L19 8 V20 A1 1 0 0 1 18 21 H6 A1 1 0 0 1 5 20 V4 A1 1 0 0 1 6 3 Z" />
      <Path d="M14 3 V8 H19" />
      <Path d="M8 13 H16 M8 16.5 H14" />
    </Base>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11 V16" />
      <Circle cx={12} cy={8} r={0.6} />
    </Base>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M4 5 L20 19" />
      <Path d="M9.5 5.3 C 10.3 5.1 11.1 5 12 5 C 15 5 19 6.5 22 12 C 21.2 13.5 20.3 14.7 19.4 15.7" />
      <Path d="M15.5 15.2 C 14.5 16 13.3 16.5 12 16.5 C 9 16.5 5 15 2 9.5 M6.2 7.7 C 4.7 8.7 3.3 10.2 2.4 12" />
      <Path d="M9.9 9.9 A 3 3 0 0 0 14.1 14.1" />
    </Base>
  );
}
