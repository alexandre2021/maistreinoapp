import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface LoadingIconProps {
  size?: number;
  color?: string;
}

export default function LoadingIcon({ 
  size = 20, 
  color = "#FFFFFF" 
}: LoadingIconProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Ionicons name="barbell" size={size} color={color} />
    </Animated.View>
  );
}
