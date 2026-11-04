import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const isAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const getRuntimePlatform = (): 'android' | 'ios' | 'web' => {
  if (!Capacitor.isNativePlatform()) return 'web';
  return Capacitor.getPlatform() as 'android' | 'ios';
};
