import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '@/theme';

/**
 * Fond de header "Home v5" : dégradé navy multi-tons + halos radiaux,
 * routes pointillées jaunes et particules flottantes (Animated natif).
 * Purement décoratif — pointerEvents none, aucune donnée.
 */

type Particle = { x: number; y: number; s: number; o: number; dx: number; dy: number; d: number; dl: number };

// x/y en % du header, s = taille px, o = opacité de repos, dx/dy = dérive px,
// d = durée s, dl = délai s — valeurs reprises de la maquette Home v5.
const PARTICLES: Particle[] = [
  { x: 8, y: 18, s: 3, o: 0.65, dx: 6, dy: -8, d: 6.2, dl: 0 },
  { x: 22, y: 8, s: 2, o: 0.55, dx: -4, dy: 10, d: 7.5, dl: 1.1 },
  { x: 35, y: 22, s: 4, o: 0.85, dx: 8, dy: -12, d: 5.8, dl: 0.4 },
  { x: 50, y: 12, s: 2, o: 0.45, dx: -6, dy: -6, d: 6.9, dl: 2.0 },
  { x: 64, y: 28, s: 3, o: 0.7, dx: 5, dy: 9, d: 7.2, dl: 0.9 },
  { x: 78, y: 16, s: 2, o: 0.5, dx: -7, dy: 7, d: 6.5, dl: 1.6 },
  { x: 90, y: 30, s: 4, o: 0.85, dx: 6, dy: -10, d: 5.4, dl: 0.2 },
  { x: 14, y: 44, s: 2, o: 0.4, dx: 4, dy: -5, d: 7.8, dl: 2.4 },
  { x: 42, y: 52, s: 3, o: 0.6, dx: -5, dy: 8, d: 6.7, dl: 1.3 },
  { x: 70, y: 56, s: 2, o: 0.45, dx: 7, dy: 5, d: 7.1, dl: 0.6 },
];

function FloatingDot({ p }: { p: Particle }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(p.dl * 1000),
        Animated.timing(t, { toValue: 1, duration: (p.d * 1000) / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: (p.d * 1000) / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, p]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.s,
        height: p.s,
        borderRadius: p.s / 2,
        backgroundColor: palette.yellowHi,
        shadowColor: palette.yellow,
        shadowOpacity: 0.55,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [p.o, 1] }),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
        ],
      }}
    />
  );
}

export function HeaderBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="hb-base" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#234B83" />
            <Stop offset="0.55" stopColor={palette.navy} />
            <Stop offset="1" stopColor="#142E5A" />
          </LinearGradient>
          <RadialGradient id="hb-hi" cx="0%" cy="0%" r="75%">
            <Stop offset="0" stopColor="#2A5894" stopOpacity="1" />
            <Stop offset="1" stopColor="#2A5894" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="hb-lo" cx="100%" cy="100%" r="70%">
            <Stop offset="0" stopColor="#102A52" stopOpacity="1" />
            <Stop offset="1" stopColor="#102A52" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="hb-glow" cx="85%" cy="10%" r="60%">
            <Stop offset="0" stopColor={palette.yellow} stopOpacity="0.14" />
            <Stop offset="0.55" stopColor={palette.yellow} stopOpacity="0.04" />
            <Stop offset="1" stopColor={palette.yellow} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="hb-route" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.yellow} stopOpacity="0" />
            <Stop offset="0.5" stopColor={palette.yellow} stopOpacity="0.3" />
            <Stop offset="1" stopColor={palette.yellow} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="320" fill="url(#hb-base)" />
        <Rect width="400" height="320" fill="url(#hb-hi)" />
        <Rect width="400" height="320" fill="url(#hb-lo)" />
        <Rect width="400" height="320" fill="url(#hb-glow)" />
        <Path
          d="M -20 220 C 90 140, 180 280, 280 180 S 420 80, 460 130"
          fill="none"
          stroke="url(#hb-route)"
          strokeWidth={1.2}
          strokeDasharray="4 6"
          opacity={0.55}
        />
        <Path
          d="M -10 90 C 80 30, 200 110, 300 70 S 420 30, 460 50"
          fill="none"
          stroke="url(#hb-route)"
          strokeWidth={1}
          strokeDasharray="3 8"
          opacity={0.55}
        />
      </Svg>
      {PARTICLES.map((p, i) => (
        <FloatingDot key={i} p={p} />
      ))}
    </View>
  );
}
