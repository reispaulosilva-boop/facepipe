"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, OrbitControls, Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Landmark } from "@/utils/facialAnalysis";

interface ThreeDFaceViewerProps {
  landmarks: Landmark[] | null;
  onClose: () => void;
}

function FacePointCloud({ landmarks }: { landmarks: Landmark[] }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Map landmarks to 3D space
  // Assuming landmarks are normalized 0-1
  const positions = useMemo(() => {
    const arr = new Float32Array(landmarks.length * 3);
    landmarks.forEach((lm, i) => {
      // Center and scale for 3D view
      // x: 0.5 -> 0, y: 0.5 -> 0, z is depth
      arr[i * 3] = (lm.x - 0.5) * 5;
      arr[i * 3 + 1] = (0.5 - lm.y) * 7; // Invert Y for 3D space
      arr[i * 3 + 2] = (lm.z || 0) * -10; // Depth scaling
    });
    return arr;
  }, [landmarks]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Subtle float/rotation if needed
      pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#0ea5e9" // Cyan-500
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export function ThreeDFaceViewer({ landmarks, onClose }: ThreeDFaceViewerProps) {
  if (!landmarks) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 20 }}
      className="fixed right-20 top-24 bottom-6 w-96 bg-[#030712]/80 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] z-[150]"
    >
      {/* Scanner HUD Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-[#030712] to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
            Scanner Cinético 3D
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 transition-colors text-[10px] uppercase font-bold tracking-widest"
        >
          Fechar
        </button>
      </div>

      {/* R3F Canvas */}
      <Canvas className="w-full h-full cursor-grab active:cursor-grabbing">
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#0ea5e9" />
        
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <FacePointCloud landmarks={landmarks} />
        </Float>

        <OrbitControls 
          enablePan={false} 
          minDistance={4} 
          maxDistance={12}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
        
        {/* Grid helper for clinical feel */}
        <gridHelper 
          args={[20, 20, "#1e293b", "#0f172a"]} 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, -2]}
        />
      </Canvas>

      {/* Bottom HUD overlay */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-white/30 uppercase font-bold">Volumetric Mesh</span>
            <span className="text-[10px] text-white/60 font-mono">478 Points Loaded</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[8px] text-white/30 uppercase font-bold">Status</span>
            <span className="text-[10px] text-sky-400 font-mono uppercase">Live Inspect</span>
          </div>
        </div>
        
        {/* Decorative scanline */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-sky-500/30 to-transparent relative overflow-hidden">
          <motion.div 
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute top-0 bottom-0 w-1/4 bg-sky-400/50 blur-sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
