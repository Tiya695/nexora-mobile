import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { SceneObject } from '../lib/geoTo3d';
import { NxText } from './ui/NxText';
import { colors } from '../theme/tokens';

interface InfrastructureScene3DProps {
  objects: SceneObject[];
}

export function InfrastructureScene3D({ objects }: InfrastructureScene3DProps) {
  const interactionRef = useRef({
    theta: 0,
    phi: 0.6, // Initial tilt angle
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const onTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    if (touch) {
      interactionRef.current.isDragging = true;
      interactionRef.current.lastX = touch.pageX;
      interactionRef.current.lastY = touch.pageY;
    }
  };

  const onTouchMove = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    if (touch && interactionRef.current.isDragging) {
      const deltaX = touch.pageX - interactionRef.current.lastX;
      const deltaY = touch.pageY - interactionRef.current.lastY;
      
      interactionRef.current.lastX = touch.pageX;
      interactionRef.current.lastY = touch.pageY;

      // Update horizontal angle (theta) and vertical angle (phi)
      interactionRef.current.theta -= deltaX * 0.01;
      interactionRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, interactionRef.current.phi + deltaY * 0.01));
    }
  };

  const onTouchEnd = () => {
    interactionRef.current.isDragging = false;
  };

  const onContextCreate = async (gl: any) => {
    const renderer: any = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x060608, 1);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(0, 7, 10);
    camera.lookAt(0, 0, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 8, 5);
    scene.add(dir);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      new THREE.MeshStandardMaterial({ color: 0x0c0c14 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Grid
    scene.add(new THREE.GridHelper(22, 22, 0x2a2a40, 0x1a1a2e));

    // Issue marker — bright red pulsing cone at center
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xe05a5a, emissive: 0xe05a5a, emissiveIntensity: 0.4 })
    );
    cone.position.set(0, 0.35, 0);
    scene.add(cone);

    // Ring around the issue marker for extra visibility
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.6, 16),
      new THREE.MeshBasicMaterial({ color: 0xe05a5a, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Real OSM objects — scale clamped so nothing is invisibly tiny or absurdly tall
    objects.forEach((obj) => {
      const h = Math.max(0.3, Math.min(obj.height, 2.5));
      const w = obj.type.startsWith('road') ? 0.7 : 0.5;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, w),
        new THREE.MeshStandardMaterial({ color: obj.color })
      );
      mesh.position.set(obj.x, h / 2, obj.z);
      scene.add(mesh);

      // White outline
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, w)),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
      );
      edges.position.copy(mesh.position);
      scene.add(edges);
    });

    const render = () => {
      requestAnimationFrame(render);
      
      if (!interactionRef.current.isDragging) {
        // Slow continuous orbit when not actively dragging
        interactionRef.current.theta += 0.005;
      }
      
      const radius = 12.2;
      const theta = interactionRef.current.theta;
      const phi = interactionRef.current.phi;

      camera.position.x = radius * Math.cos(phi) * Math.sin(theta);
      camera.position.z = radius * Math.cos(phi) * Math.cos(theta);
      camera.position.y = radius * Math.sin(phi);
      camera.lookAt(0, 0.5, 0);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <View style={styles.wrapper}>
      <View
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <GLView style={styles.gl} onContextCreate={onContextCreate} />
      </View>
      <View style={styles.legend}>
        <NxText variant="caption" color={colors.red}>● Issue</NxText>
        <NxText variant="caption" color={colors.purple}>● Building</NxText>
        <NxText variant="caption" color={colors.teal}>● Road</NxText>
        <NxText variant="caption" color={colors.gold}>● Amenity</NxText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginTop: 8, marginBottom: 4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#060608' },
  gl:      { width: '100%', height: 240 },
  legend:  { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#0c0c10' },
});