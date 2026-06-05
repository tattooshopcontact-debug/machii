import { Image } from 'expo-image';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { colors, fonts, palette } from '@/theme';

import { Text } from './Text';

type Tint = 'orange' | 'navy' | 'yellow';

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
  /** Teinte de la sphère glossy si pas de photo. */
  tint?: Tint;
  verified?: boolean;
};

/** Dégradés glossy (hi / bg / lo) par teinte — recette "glossy sphere" du handoff. */
const spheres: Record<Tint, { hi: string; bg: string; lo: string; fg: string }> = {
  orange: { hi: palette.orangeHi, bg: palette.orange, lo: palette.orangeLo, fg: palette.white },
  navy: { hi: palette.blueHi, bg: palette.navy, lo: palette.blueLo, fg: palette.white },
  yellow: { hi: palette.yellowHi, bg: palette.yellow, lo: palette.yellowLo, fg: palette.navy },
};

/** Avatar "sphère glossy" 3D : reflet spéculaire + ombre projetée. */
export function Avatar({ name, uri, size = 48, tint = 'navy', verified = false }: AvatarProps) {
  const u = useId();
  const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  const s = spheres[tint];
  const badge = Math.max(14, size * 0.3);

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id={`${u}sph`} cx="28%" cy="22%" r="80%">
                <Stop offset="0%" stopColor={s.hi} />
                <Stop offset="52%" stopColor={s.bg} />
                <Stop offset="100%" stopColor={s.lo} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="48" fill={`url(#${u}sph)`} />
            {/* reflet spéculaire haut-gauche */}
            <Ellipse cx="36" cy="28" rx="20" ry="11" fill="rgba(255,255,255,0.45)" />
          </Svg>
          <View style={styles.initialWrap}>
            <Text style={{ fontFamily: fonts.heavy, fontSize: size * 0.4, color: s.fg }}>{initial}</Text>
          </View>
        </View>
      )}
      {verified && (
        <View style={[styles.verified, { width: badge, height: badge, borderRadius: badge / 2 }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: badge * 0.6, color: palette.white }}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  initialWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  verified: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
