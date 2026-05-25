// Camera angle system for Neon Hockey VR
import { Vector3 } from '@iwsdk/core';

export interface CameraAngle {
  id: string;
  name: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  icon: string;
}

export const CAMERA_ANGLES: CameraAngle[] = [
  {
    id: 'default',
    name: 'Classic',
    position: [0, 1.6, 0.8],
    lookAt: [0, 0.9, -0.2],
    icon: '📐',
  },
  {
    id: 'overhead',
    name: 'Overhead',
    position: [0, 2.8, -0.2],
    lookAt: [0, 0.9, -0.5],
    icon: '🔽',
  },
  {
    id: 'closeup',
    name: 'Close Up',
    position: [0, 1.3, 0.5],
    lookAt: [0, 0.9, -0.3],
    icon: '🔍',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    position: [0.8, 1.5, 0.4],
    lookAt: [0, 0.9, -0.3],
    icon: '🎬',
  },
  {
    id: 'broadcast',
    name: 'Broadcast',
    position: [0, 2.2, 0.0],
    lookAt: [0, 0.9, -0.3],
    icon: '📺',
  },
];

export function getCameraAngleById(id: string): CameraAngle {
  return CAMERA_ANGLES.find(a => a.id === id) || CAMERA_ANGLES[0];
}

export function getSavedCameraAngle(): string {
  return localStorage.getItem('neon-hockey-camera-angle') || 'default';
}

export function saveCameraAngle(id: string): void {
  localStorage.setItem('neon-hockey-camera-angle', id);
}
