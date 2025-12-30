import React, { useCallback, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getTabColorByIndex, TAB_ORDER } from '../constants/tabColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPRING_CONFIG = {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
};

const SWIPE_VELOCITY_THRESHOLD = 150;
const SWIPE_DISTANCE_THRESHOLD = SCREEN_WIDTH * 0.12;

interface SwipeGestureOverlayProps {
    currentIndex: number;
    onNavigate: (tabName: string) => void;
}

export const SwipeGestureOverlay: React.FC<SwipeGestureOverlayProps> = ({
    currentIndex,
    onNavigate,
}) => {
    const gestureProgress = useSharedValue(0);
    const swipeDirection = useSharedValue<'left' | 'right' | null>(null);

    // Use refs to always have the latest values in gesture callbacks
    const currentIndexRef = useRef(currentIndex);
    const onNavigateRef = useRef(onNavigate);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
        onNavigateRef.current = onNavigate;
    }, [currentIndex, onNavigate]);

    const triggerHaptic = useCallback(() => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, []);

    // Pacman-style navigation: wrap around at edges
    const navigateToTab = useCallback((direction: 'left' | 'right') => {
        const idx = currentIndexRef.current;
        const tabCount = TAB_ORDER.length;

        let newIndex: number;
        if (direction === 'left') {
            // Swipe left = go to next tab (or wrap to first)
            newIndex = (idx + 1) % tabCount;
        } else {
            // Swipe right = go to previous tab (or wrap to last)
            newIndex = (idx - 1 + tabCount) % tabCount;
        }

        const targetTab = TAB_ORDER[newIndex];
        triggerHaptic();
        onNavigateRef.current(targetTab);
    }, [triggerHaptic]);

    // Factory to create fresh gesture for each zone (gestures can't be shared)
    const createPanGesture = () => Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-15, 15])
        .onUpdate((event) => {
            swipeDirection.value = event.translationX < 0 ? 'left' : 'right';
            gestureProgress.value = Math.min(
                Math.abs(event.translationX) / (SCREEN_WIDTH * 0.3),
                1
            );
        })
        .onEnd((event) => {
            gestureProgress.value = withSpring(0, SPRING_CONFIG);

            const hasVelocity = Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD;
            const hasDistance = Math.abs(event.translationX) > SWIPE_DISTANCE_THRESHOLD;

            if (hasVelocity || hasDistance) {
                const dir = event.translationX < 0 ? 'left' : 'right';
                runOnJS(navigateToTab)(dir);
            }

            swipeDirection.value = null;
        });

    // Fresh gesture instances for each zone
    const leftEdgeGesture = createPanGesture();
    const rightEdgeGesture = createPanGesture();

    // Get colors for glow effects based on navigation direction
    const getNextTabColor = () => {
        const tabCount = TAB_ORDER.length;
        const nextIndex = (currentIndex + 1) % tabCount;
        return getTabColorByIndex(nextIndex).glow;
    };

    const getPrevTabColor = () => {
        const tabCount = TAB_ORDER.length;
        const prevIndex = (currentIndex - 1 + tabCount) % tabCount;
        return getTabColorByIndex(prevIndex).glow;
    };

    const leftGlowStyle = useAnimatedStyle(() => ({
        opacity: swipeDirection.value === 'right'
            ? interpolate(gestureProgress.value, [0, 1], [0, 0.85], Extrapolation.CLAMP)
            : 0,
    }));

    const rightGlowStyle = useAnimatedStyle(() => ({
        opacity: swipeDirection.value === 'left'
            ? interpolate(gestureProgress.value, [0, 1], [0, 0.85], Extrapolation.CLAMP)
            : 0,
    }));

    return (
        <>
            {/* LEFT edge gesture zone */}
            <GestureDetector gesture={leftEdgeGesture}>
                <Animated.View style={styles.leftEdgeZone} />
            </GestureDetector>

            {/* RIGHT edge gesture zone */}
            <GestureDetector gesture={rightEdgeGesture}>
                <Animated.View style={styles.rightEdgeZone} />
            </GestureDetector>

            {/* Left glow - shows when swiping right (going to previous/last tab) */}
            <Animated.View style={[styles.glowOverlayLeft, leftGlowStyle]} pointerEvents="none">
                <LinearGradient
                    colors={[getPrevTabColor(), 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.glowGradient}
                />
            </Animated.View>

            {/* Right glow - shows when swiping left (going to next/first tab) */}
            <Animated.View style={[styles.glowOverlayRight, rightGlowStyle]} pointerEvents="none">
                <LinearGradient
                    colors={['transparent', getNextTabColor()]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.glowGradient}
                />
            </Animated.View>
        </>
    );
};

const EDGE_WIDTH = 60; // Width of swipe zones on each side

const styles = StyleSheet.create({
    leftEdgeZone: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 90, // Above tab bar
        width: EDGE_WIDTH,
        zIndex: 1000, // High z-index to stay above all content
        backgroundColor: 'transparent',
    },
    rightEdgeZone: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 90,
        width: EDGE_WIDTH,
        zIndex: 1000,
        backgroundColor: 'transparent',
    },
    glowOverlayLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 90,
        width: 120,
        zIndex: 49,
    },
    glowOverlayRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 90,
        width: 120,
        zIndex: 49,
    },
    glowGradient: {
        flex: 1,
    },
});

export default SwipeGestureOverlay;
