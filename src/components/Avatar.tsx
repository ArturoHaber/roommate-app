import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
}

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZES = {
  xs: 9,
  sm: FONT_SIZE.xs,
  md: FONT_SIZE.md,
  lg: FONT_SIZE.xl,
  xl: FONT_SIZE.xxxl,
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  color,
  size = 'md',
  showBorder = false,
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: color,
        },
        showBorder && styles.border,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
  },
  border: {
    borderWidth: 3,
    borderColor: COLORS.white,
  },
});
