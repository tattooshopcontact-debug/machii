import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { palette } from '@/theme';

type LogoProps = {
  /** Hauteur cible en px (la largeur suit le ratio). */
  size?: number;
  /** 'full' = wordmark + arc · 'mark' = juste les 2 cercles + arc (app icon). */
  variant?: 'full' | 'mark';
  /** Inverse les couleurs (sur fond foncé) : wordmark en blanc. */
  inverted?: boolean;
};

/**
 * Logo Machii — variation "Curved Arc" (décision design figée).
 * Les deux "i" finaux n'ont pas de point : deux sphères jaunes glossy reliées
 * par un arc courbe doux qui suggère un trajet reliant deux villes.
 */
export function Logo({ size = 40, variant = 'full', inverted = false }: LogoProps) {
  const u = useId();
  const wordColor = inverted ? palette.white : palette.navy;

  const dotDefs = (
    <Defs>
      <RadialGradient id={`${u}dot`} cx="32%" cy="26%" r="80%">
        <Stop offset="0%" stopColor={palette.yellowHi} />
        <Stop offset="55%" stopColor={palette.yellow} />
        <Stop offset="100%" stopColor={palette.yellowLo} />
      </RadialGradient>
    </Defs>
  );

  if (variant === 'mark') {
    const s = size;
    return (
      <View accessibilityLabel="Machii">
        <Svg width={s} height={s} viewBox="0 0 64 64">
          {dotDefs}
          <Path d="M16 34 C 16 18, 48 18, 48 34" stroke={palette.yellow} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Circle cx={16} cy={36} r={8} fill={`url(#${u}dot)`} />
          <Circle cx={48} cy={36} r={8} fill={`url(#${u}dot)`} />
          <Ellipse cx={13.5} cy={33} rx={3} ry={1.6} fill="rgba(255,255,255,0.7)" />
          <Ellipse cx={45.5} cy={33} rx={3} ry={1.6} fill="rgba(255,255,255,0.7)" />
        </Svg>
      </View>
    );
  }

  const ratio = 220 / 70;
  const height = size * 1.6;
  const width = height * ratio;

  return (
    <View accessibilityLabel="Machii">
      <Svg width={width} height={height} viewBox="0 0 220 70">
        {dotDefs}
        <SvgText x={0} y={54} fontFamily="Jakarta_800ExtraBold" fontSize={52} fontWeight="800" fill={wordColor}>
          Mach
        </SvgText>
        <Rect x={134} y={26} width={9} height={28} rx={4.5} fill={wordColor} />
        <Rect x={156} y={26} width={9} height={28} rx={4.5} fill={wordColor} />
        <Path d="M138.5 12 C 145 2, 158.5 2, 160.5 12" stroke={palette.yellow} strokeWidth={5} strokeLinecap="round" fill="none" />
        <Circle cx={138.5} cy={13} r={7} fill={`url(#${u}dot)`} />
        <Circle cx={160.5} cy={13} r={7} fill={`url(#${u}dot)`} />
        <Ellipse cx={136.5} cy={10.5} rx={2.6} ry={1.4} fill="rgba(255,255,255,0.75)" />
        <Ellipse cx={158.5} cy={10.5} rx={2.6} ry={1.4} fill="rgba(255,255,255,0.75)" />
      </Svg>
    </View>
  );
}
