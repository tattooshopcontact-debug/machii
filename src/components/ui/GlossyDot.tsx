import { useId } from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { palette } from '@/theme';

type Tint = 'navy' | 'orange' | 'yellow';

const tints: Record<Tint, { hi: string; bg: string; lo: string }> = {
  navy: { hi: palette.blueHi, bg: palette.navy, lo: palette.blueLo },
  orange: { hi: palette.orangeHi, bg: palette.orange, lo: palette.orangeLo },
  yellow: { hi: palette.yellowHi, bg: palette.yellow, lo: palette.yellowLo },
};

/** Point glossy 3D (marqueur départ/arrivée) — recette sphère du pack design. */
export function GlossyDot({ tint = 'navy', size = 14 }: { tint?: Tint; size?: number }) {
  const u = useId();
  const c = tints[tint];
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Defs>
        <RadialGradient id={`${u}gd`} cx="30%" cy="25%" r="85%">
          <Stop offset="0%" stopColor={c.hi} />
          <Stop offset="55%" stopColor={c.bg} />
          <Stop offset="100%" stopColor={c.lo} />
        </RadialGradient>
      </Defs>
      <Circle cx={7} cy={7} r={7} fill={`url(#${u}gd)`} />
    </Svg>
  );
}
