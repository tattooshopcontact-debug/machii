/**
 * Machii — Système d'icônes "Style A" (Glassmorphic 3D).
 * Porté fidèlement depuis le handoff design (Machii Icons Style A v2).
 *
 * Notes de portage react-native-svg :
 * - les <filter>/feDropShadow SVG ne sont pas supportés → on garde l'ellipse
 *   d'ombre de contact au sol + les dégradés pour le relief.
 * - les id de gradients sont suffixés par useId() pour éviter les collisions
 *   quand une icône est rendue plusieurs fois.
 */
import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, RadialGradient, Stop } from 'react-native-svg';

type IconProps = {
  /** Hauteur cible en px (largeur calculée selon le ratio du viewBox). */
  size?: number;
};

function dims(vbW: number, vbH: number, size: number) {
  return { width: (size * vbW) / vbH, height: size, viewBox: `0 0 ${vbW} ${vbH}` };
}

export function IconStar({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(120, 120, size)}>
      <Defs>
        <RadialGradient id={`${u}f`} cx="32%" cy="22%" r="85%">
          <Stop offset="0%" stopColor="#FFFBE0" />
          <Stop offset="22%" stopColor="#FFF09B" />
          <Stop offset="55%" stopColor="#FFD400" />
          <Stop offset="85%" stopColor="#D69A00" />
          <Stop offset="100%" stopColor="#7a4d00" />
        </RadialGradient>
        <LinearGradient id={`${u}e`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE85A" />
          <Stop offset="1" stopColor="#9b6b00" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="106" rx="36" ry="3" fill="rgba(0,0,0,0.22)" />
      <Path
        d="M60 12 L73.6 39.6 104 44 L82 65.4 87.2 95.4 60 81.2 32.8 95.4 38 65.4 16 44 46.4 39.6Z"
        fill={`url(#${u}f)`}
        stroke={`url(#${u}e)`}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M60 12 L60 81.2 L32.8 95.4 38 65.4 16 44 46.4 39.6 Z" fill="rgba(0,0,0,0.10)" />
      <Path d="M46 24 Q56 18 64 22 Q60 30 50 36 Q42 30 46 24Z" fill="rgba(255,255,255,0.78)" />
    </Svg>
  );
}

export function IconCar({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(200, 140, size)}>
      <Defs>
        <LinearGradient id={`${u}b`} x1="0.3" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#7DAFE8" />
          <Stop offset="35%" stopColor="#3F76C0" />
          <Stop offset="75%" stopColor="#1B3D6E" />
          <Stop offset="100%" stopColor="#0A1F3D" />
        </LinearGradient>
        <LinearGradient id={`${u}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D8E8FA" />
          <Stop offset="50%" stopColor="#6F95C5" />
          <Stop offset="100%" stopColor="#23456F" />
        </LinearGradient>
        <LinearGradient id={`${u}belt`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0A1F3D" />
          <Stop offset="1" stopColor="#1B3D6E" />
        </LinearGradient>
        <RadialGradient id={`${u}rim`} cx="35%" cy="30%" r="70%">
          <Stop offset="0" stopColor="#cfcfcf" />
          <Stop offset="50%" stopColor="#7a7a7a" />
          <Stop offset="100%" stopColor="#1a1a1a" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="100" cy="128" rx="80" ry="4" fill="rgba(0,0,0,0.32)" />
      <Path
        d="M14 92 Q18 70 38 64 L60 36 Q70 28 88 26 L130 26 Q150 26 162 36 L182 64 Q190 68 192 78 L192 102 Q192 108 186 108 L168 108 Q166 96 156 96 Q146 96 144 108 L60 108 Q58 96 48 96 Q38 96 36 108 L20 108 Q14 108 14 102 Z"
        fill={`url(#${u}b)`}
      />
      <Path d="M28 82 Q90 72 184 80" stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M64 36 Q72 30 86 28 L132 28 Q146 30 158 38 L172 60 Q172 62 168 62 L106 62 L106 36 Z" fill={`url(#${u}g)`} opacity={0.92} />
      <Path d="M62 36 Q72 30 86 28 L100 28 L100 62 L52 62 Q48 62 50 58 Z" fill={`url(#${u}g)`} opacity={0.92} />
      <Line x1="102" y1="28" x2="102" y2="62" stroke={`url(#${u}belt)`} strokeWidth={3.4} />
      <Ellipse cx="186" cy="82" rx="6" ry="4" fill="#FFF7C2" />
      <Ellipse cx="14" cy="86" rx="4" ry="3" fill="#FF4d4d" />
      <Circle cx="48" cy="106" r="14" fill="#0a0a0a" />
      <Circle cx="48" cy="106" r="9" fill={`url(#${u}rim)`} />
      <Circle cx="156" cy="106" r="14" fill="#0a0a0a" />
      <Circle cx="156" cy="106" r="9" fill={`url(#${u}rim)`} />
    </Svg>
  );
}

export function IconLock({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(110, 130, size)}>
      <Defs>
        <LinearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f4f4f4" />
          <Stop offset="40%" stopColor="#b8b8b8" />
          <Stop offset="100%" stopColor="#5a5a5a" />
        </LinearGradient>
        <RadialGradient id={`${u}b`} cx="32%" cy="22%" r="85%">
          <Stop offset="0%" stopColor="#FFFBE0" />
          <Stop offset="22%" stopColor="#FFF09B" />
          <Stop offset="55%" stopColor="#FFD400" />
          <Stop offset="85%" stopColor="#C99100" />
          <Stop offset="100%" stopColor="#6B4400" />
        </RadialGradient>
        <LinearGradient id={`${u}k`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3a2700" />
          <Stop offset="1" stopColor="#1a1100" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="55" cy="120" rx="36" ry="3" fill="rgba(0,0,0,0.28)" />
      <Path d="M30 56 V36 a25 25 0 0 1 50 0 V56" fill="none" stroke={`url(#${u}s)`} strokeWidth={11} strokeLinecap="round" />
      <Path d="M32 54 V38 a23 23 0 0 1 16 -22" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.4} strokeLinecap="round" />
      <Rect x="14" y="54" width="82" height="64" rx="12" fill={`url(#${u}b)`} stroke="#7a4d00" strokeWidth={1} />
      <Path d="M22 60 Q55 56 88 60 Q60 74 22 70 Z" fill="rgba(255,255,255,0.45)" />
      <Circle cx="55" cy="84" r="12" fill={`url(#${u}k)`} />
      <Circle cx="55" cy="84" r="6" fill="#FFD400" />
      <Rect x="52" y="86" width="6" height="14" rx="2" fill={`url(#${u}k)`} />
    </Svg>
  );
}

export function IconWarning({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(130, 120, size)}>
      <Defs>
        <LinearGradient id={`${u}f`} x1="0.3" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor="#FFD8B0" />
          <Stop offset="30%" stopColor="#FFB572" />
          <Stop offset="65%" stopColor="#F18A4D" />
          <Stop offset="100%" stopColor="#8E3E10" />
        </LinearGradient>
        <LinearGradient id={`${u}e`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB572" />
          <Stop offset="1" stopColor="#7a3d12" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="65" cy="110" rx="44" ry="3" fill="rgba(0,0,0,0.28)" />
      <Path d="M65 10 L120 104 H10 Z" fill={`url(#${u}f)`} stroke={`url(#${u}e)`} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M65 10 L65 104 L10 104 Z" fill="rgba(0,0,0,0.14)" />
      <Rect x="61" y="46" width="8" height="32" rx="3.5" fill="#fff" />
      <Circle cx="65" cy="88" r="5" fill="#fff" />
    </Svg>
  );
}

export function IconNoSmoke({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(140, 120, size)}>
      <Defs>
        <LinearGradient id={`${u}p`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="50%" stopColor="#f4f0e4" />
          <Stop offset="100%" stopColor="#a89e80" />
        </LinearGradient>
        <LinearGradient id={`${u}fi`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE085" />
          <Stop offset="100%" stopColor="#8c6800" />
        </LinearGradient>
        <RadialGradient id={`${u}r`} cx="35%" cy="25%" r="80%">
          <Stop offset="0" stopColor="#FF9090" />
          <Stop offset="40%" stopColor="#E04040" />
          <Stop offset="100%" stopColor="#6B0F0F" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="70" cy="112" rx="48" ry="3" fill="rgba(0,0,0,0.26)" />
      <Path d="M30 40 C32 32 24 28 28 18" stroke="#a6b0bc" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M42 38 C44 30 36 26 40 16" stroke="#a6b0bc" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.5} />
      <Rect x="10" y="52" width="100" height="14" rx="3" fill={`url(#${u}p)`} stroke="rgba(0,0,0,0.18)" strokeWidth={0.6} />
      <Rect x="10" y="52" width="24" height="14" fill={`url(#${u}fi)`} />
      <Rect x="106" y="52" width="6" height="14" fill="#F18A4D" />
      <Ellipse cx="109" cy="59" rx="2.5" ry="3" fill="#FFD400" />
      <Rect x="14" y="54" width="92" height="3" rx="1.4" fill="rgba(255,255,255,0.75)" />
      <Circle cx="80" cy="58" r="38" fill="none" stroke={`url(#${u}r)`} strokeWidth={9} />
      <Path d="M55 30 L106 84" stroke={`url(#${u}r)`} strokeWidth={9} strokeLinecap="round" />
    </Svg>
  );
}

export function IconMusic({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(120, 120, size)}>
      <Defs>
        <LinearGradient id={`${u}h`} x1="0.25" y1="0" x2="0.5" y2="1">
          <Stop offset="0%" stopColor="#9CC3EE" />
          <Stop offset="30%" stopColor="#4D81C8" />
          <Stop offset="70%" stopColor="#1B3D6E" />
          <Stop offset="100%" stopColor="#0A1F3D" />
        </LinearGradient>
        <LinearGradient id={`${u}st`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5A8FD8" />
          <Stop offset="55%" stopColor="#1B3D6E" />
          <Stop offset="100%" stopColor="#0A1F3D" />
        </LinearGradient>
        <LinearGradient id={`${u}be`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7DAFE8" />
          <Stop offset="50%" stopColor="#1B3D6E" />
          <Stop offset="100%" stopColor="#0A1F3D" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="112" rx="40" ry="3" fill="rgba(0,0,0,0.28)" />
      <Rect x="32" y="22" width="6" height="58" rx="2" fill={`url(#${u}st)`} />
      <Rect x="86" y="14" width="6" height="60" rx="2" fill={`url(#${u}st)`} />
      <Path d="M32 22 L92 12 L92 26 L32 36 Z" fill={`url(#${u}be)`} />
      <Path d="M34 24 L90 14" stroke="rgba(255,255,255,0.78)" strokeWidth={1.6} strokeLinecap="round" />
      <Ellipse cx="24" cy="84" rx="18" ry="13" fill={`url(#${u}h)`} transform="rotate(-22 24 84)" />
      <Ellipse cx="78" cy="78" rx="18" ry="13" fill={`url(#${u}h)`} transform="rotate(-22 78 78)" />
    </Svg>
  );
}

export function IconChat({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(120, 120, size)}>
      <Defs>
        <LinearGradient id={`${u}b`} x1="0.3" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#7DAFE8" />
          <Stop offset="40%" stopColor="#3F76C0" />
          <Stop offset="80%" stopColor="#1B3D6E" />
          <Stop offset="100%" stopColor="#0A1F3D" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="112" rx="40" ry="3" fill="rgba(0,0,0,0.28)" />
      <Path
        d="M12 26 a14 14 0 0 1 14 -14 h68 a14 14 0 0 1 14 14 v40 a14 14 0 0 1 -14 14 H44 L24 102 V80 H26 a14 14 0 0 1 -14 -14 Z"
        fill={`url(#${u}b)`}
      />
      <Ellipse cx="32" cy="32" rx="14" ry="4" fill="rgba(255,255,255,0.55)" />
      <Circle cx="38" cy="48" r="5" fill="#FFE85A" />
      <Circle cx="60" cy="48" r="5" fill="#FFE85A" />
      <Circle cx="82" cy="48" r="5" fill="#FFE85A" />
    </Svg>
  );
}

export function IconClock({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(120, 120, size)}>
      <Defs>
        <LinearGradient id={`${u}bz`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f4f4f4" />
          <Stop offset="35%" stopColor="#a8a8a8" />
          <Stop offset="65%" stopColor="#3f3f3f" />
          <Stop offset="100%" stopColor="#1a1a1a" />
        </LinearGradient>
        <RadialGradient id={`${u}fa`} cx="35%" cy="25%" r="80%">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="45%" stopColor="#fbf5e6" />
          <Stop offset="85%" stopColor="#d8cdb1" />
          <Stop offset="100%" stopColor="#8a7f60" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="60" cy="112" rx="42" ry="3" fill="rgba(0,0,0,0.28)" />
      <Circle cx="60" cy="60" r="52" fill={`url(#${u}bz)`} />
      <Circle cx="60" cy="60" r="44" fill={`url(#${u}fa)`} />
      <Ellipse cx="48" cy="32" rx="22" ry="8" fill="rgba(255,255,255,0.78)" />
      <Rect x="58" y="20" width="4" height="8" rx="1" fill="#1B3D6E" />
      <Rect x="92" y="58" width="8" height="4" rx="1" fill="#1B3D6E" />
      <Rect x="58" y="92" width="4" height="8" rx="1" fill="#1B3D6E" />
      <Rect x="20" y="58" width="8" height="4" rx="1" fill="#1B3D6E" />
      <Line x1="60" y1="60" x2="60" y2="30" stroke="#1B3D6E" strokeWidth={4} strokeLinecap="round" />
      <Line x1="60" y1="60" x2="82" y2="68" stroke="#1B3D6E" strokeWidth={3} strokeLinecap="round" />
      <Circle cx="60" cy="60" r="4" fill="#FFD400" stroke="#1B3D6E" strokeWidth={1.6} />
    </Svg>
  );
}

export function IconRoute({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(140, 120, size)}>
      <Defs>
        <LinearGradient id={`${u}l`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFE85A" />
          <Stop offset="1" stopColor="#E5B800" />
        </LinearGradient>
        <LinearGradient id={`${u}pb`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7DAFE8" />
          <Stop offset="50%" stopColor="#1B3D6E" />
          <Stop offset="100%" stopColor="#0A1F3D" />
        </LinearGradient>
        <LinearGradient id={`${u}po`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD8B0" />
          <Stop offset="50%" stopColor="#F18A4D" />
          <Stop offset="100%" stopColor="#7a3d12" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="70" cy="112" rx="48" ry="3" fill="rgba(0,0,0,0.26)" />
      <Path d="M22 92 Q44 90 50 70 Q56 50 80 44 Q104 38 116 24" fill="none" stroke={`url(#${u}l)`} strokeWidth={8} strokeLinecap="round" />
      <Path
        d="M22 90 Q44 88 50 68 Q56 48 80 42 Q104 36 116 22"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="2 6"
      />
      <Path d="M22 64 c-9 0 -14 -8 -14 -16 a14 14 0 1 1 28 0 c0 8 -5 16 -14 16z" fill={`url(#${u}pb)`} transform="translate(0 28)" />
      <Circle cx="22" cy="78" r="5" fill="#FFE85A" />
      <Path d="M116 16 c-9 0 -14 -8 -14 -16 a14 14 0 1 1 28 0 c0 8 -5 16 -14 16z" fill={`url(#${u}po)`} transform="translate(0 8)" />
      <Circle cx="116" cy="12" r="5" fill="#fff" />
    </Svg>
  );
}

export function IconShare({ size = 28 }: IconProps) {
  const u = useId();
  return (
    <Svg {...dims(120, 120, size)}>
      <Defs>
        <RadialGradient id={`${u}n`} cx="32%" cy="22%" r="85%">
          <Stop offset="0%" stopColor="#FFFBE0" />
          <Stop offset="25%" stopColor="#FFF09B" />
          <Stop offset="60%" stopColor="#FFD400" />
          <Stop offset="90%" stopColor="#C99100" />
          <Stop offset="100%" stopColor="#6B4400" />
        </RadialGradient>
        <LinearGradient id={`${u}ln`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3a2700" />
          <Stop offset="1" stopColor="#7a4d00" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="112" rx="40" ry="3" fill="rgba(0,0,0,0.28)" />
      <Line x1="42" y1="50" x2="78" y2="32" stroke={`url(#${u}ln)`} strokeWidth={6} strokeLinecap="round" />
      <Line x1="42" y1="70" x2="78" y2="88" stroke={`url(#${u}ln)`} strokeWidth={6} strokeLinecap="round" />
      <Circle cx="88" cy="26" r="18" fill={`url(#${u}n)`} stroke="#7a4d00" strokeWidth={0.6} />
      <Circle cx="30" cy="60" r="18" fill={`url(#${u}n)`} stroke="#7a4d00" strokeWidth={0.6} />
      <Circle cx="88" cy="94" r="18" fill={`url(#${u}n)`} stroke="#7a4d00" strokeWidth={0.6} />
    </Svg>
  );
}
