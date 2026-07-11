import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

export default function Test() {
  return <mesh geometry={new THREE.BoxGeometry()} />
}
