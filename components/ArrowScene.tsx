import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import {
  Scene,
  PerspectiveCamera,
  Mesh,
  Group,
  ConeGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  Color,
} from 'three';

interface ArrowSceneProps {
  rotationDeg: number;
}

export default function ArrowScene({ rotationDeg }: ArrowSceneProps) {
  const arrowRef = useRef<Group | null>(null);
  const rotationRef = useRef(rotationDeg);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    rotationRef.current = rotationDeg;
  }, [rotationDeg]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(new Color('#0a0a1a'), 1);
    rendererRef.current = renderer;

    const scene = new Scene();
    sceneRef.current = scene;

    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const camera = new PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 3.5, 6);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    const ambient = new AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const arrowGroup = new Group();

    const shaftGeo = new CylinderGeometry(0.15, 0.15, 2.0, 16);
    const shaftMat = new MeshStandardMaterial({
      color: 0xcc4400,
      roughness: 0.5,
      metalness: 0.3,
    });
    const shaft = new Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0;
    arrowGroup.add(shaft);

    const headGeo = new ConeGeometry(0.45, 1.2, 16);
    const headMat = new MeshStandardMaterial({
      color: 0xff5500,
      roughness: 0.4,
      metalness: 0.4,
    });
    const head = new Mesh(headGeo, headMat);
    head.position.y = 1.6;
    arrowGroup.add(head);

    const tailGeo = new ConeGeometry(0.3, 0.5, 16);
    const tailMat = new MeshStandardMaterial({
      color: 0x992200,
      roughness: 0.6,
      metalness: 0.2,
    });
    const tail = new Mesh(tailGeo, tailMat);
    tail.position.y = -1.2;
    tail.rotation.x = Math.PI;
    arrowGroup.add(tail);

    arrowGroup.rotation.x = Math.PI / 6;

    arrowRef.current = arrowGroup;
    scene.add(arrowGroup);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      if (arrowRef.current) {
        const targetRad = -(rotationRef.current * Math.PI) / 180;

        const current = arrowRef.current.rotation.y;
        let delta = targetRad - current;

        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;

        arrowRef.current.rotation.y = current + delta * 0.1;
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  }, []);

  return (
    <View style={styles.container}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gl: {
    flex: 1,
  },
});
