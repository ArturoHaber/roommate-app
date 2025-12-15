/**
 * Liquid Glass Icon Component
 * 
 * iOS 26-inspired liquid glass effect for icons.
 * Saved for future use - can be applied to any action icons.
 * 
 * Usage:
 * <LiquidGlassIcon color="emerald" icon="check" />
 * <LiquidGlassIcon color="violet" icon="plus" />
 * <LiquidGlassIcon color="rose" icon="eye" />
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ColorTheme = 'emerald' | 'violet' | 'rose';

interface LiquidGlassIconProps {
    color: ColorTheme;
    icon: keyof typeof Feather.glyphMap;
    size?: number;
}

const COLOR_THEMES = {
    emerald: {
        base: ['rgba(52, 211, 153, 0.15)', 'rgba(16, 185, 129, 0.08)', 'rgba(52, 211, 153, 0.12)'],
        icon: '#34D399',
    },
    violet: {
        base: ['rgba(167, 139, 250, 0.15)', 'rgba(139, 92, 246, 0.08)', 'rgba(167, 139, 250, 0.12)'],
        icon: '#A78BFA',
    },
    rose: {
        base: ['rgba(251, 146, 160, 0.15)', 'rgba(244, 63, 94, 0.08)', 'rgba(251, 146, 160, 0.12)'],
        icon: '#FB7185',
    },
};

export const LiquidGlassIcon: React.FC<LiquidGlassIconProps> = ({
    color,
    icon,
    size = 42
}) => {
    const theme = COLOR_THEMES[color];
    const iconSize = Math.round(size * 0.43); // ~18px for 42px container
    const borderRadius = Math.round(size * 0.33); // ~14px for 42px container

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius }]}>
            {/* Layer 1: Tinted Base Gradient */}
            <LinearGradient
                colors={theme.base as [string, string, string]}
                style={[styles.base, { borderRadius }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Layer 2: Specular Highlight (top shine) */}
            <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)', 'transparent']}
                style={[styles.highlight, { borderRadius }]}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 0.7, y: 0.6 }}
            />

            {/* Layer 3: Edge Ring (glowing border) */}
            <View style={[styles.edge, { borderRadius }]} />

            {/* Layer 4: Icon */}
            <Feather name={icon} size={iconSize} color={theme.icon} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        // Outer glow
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    base: {
        ...StyleSheet.absoluteFillObject,
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    edge: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        // Inner border glow
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
});

/**
 * Example usage in a screen:
 * 
 * import { LiquidGlassIcon } from '../components/LiquidGlassIcon';
 * 
 * <View style={styles.actionBar}>
 *     <TouchableOpacity style={styles.actionCard}>
 *         <LiquidGlassIcon color="emerald" icon="check" />
 *         <Text style={styles.label}>Complete</Text>
 *     </TouchableOpacity>
 *     
 *     <TouchableOpacity style={styles.actionCard}>
 *         <LiquidGlassIcon color="violet" icon="plus" />
 *         <Text style={styles.label}>Log</Text>
 *     </TouchableOpacity>
 *     
 *     <TouchableOpacity style={styles.actionCard}>
 *         <LiquidGlassIcon color="rose" icon="eye" />
 *         <Text style={styles.label}>Snitch</Text>
 *     </TouchableOpacity>
 * </View>
 */
