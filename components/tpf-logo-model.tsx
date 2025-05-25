"use client"

import { useRef } from "react"
import type * as THREE from "three"

export function TPFLogoModel(props: any) {
  const group = useRef<THREE.Group>(null)

  return (
    <group ref={group} {...props}>
      {/* Corpo principal da moeda - ESCURECIDO */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.15, 64]} />
        <meshPhysicalMaterial
          color="#404040"
          metalness={0.95}
          roughness={0.15}
          reflectivity={0.9}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Borda da moeda - REORIENTADA PARA FICAR EM PÉ */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1, 0.08, 16, 64]} />
        <meshPhysicalMaterial
          color="#505050"
          metalness={0.95}
          roughness={0.15}
          reflectivity={0.9}
          clearcoat={0.4}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Face frontal com acabamento metálico - ESCURECIDO */}
      <group position={[0, 0.075, 0]} rotation={[0, 0, 0]}>
        {/* Base da face */}
        <mesh>
          <circleGeometry args={[0.95, 64]} />
          <meshPhysicalMaterial
            color="#303030"
            metalness={0.95}
            roughness={0.15}
            reflectivity={0.9}
            clearcoat={0.2}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Círculo interno com textura diferente - ESCURECIDO */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.7, 64]} />
          <meshPhysicalMaterial
            color="#383838"
            metalness={0.95}
            roughness={0.15}
            reflectivity={0.9}
            clearcoat={0.1}
            clearcoatRoughness={0.3}
          />
        </mesh>

        {/* LINHA HORIZONTAL - AGORA PRETA */}
        <mesh position={[0, -0.08, 0.12]}>
          <boxGeometry args={[0.7, 0.05, 0.12]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Seta horizontal - ponta esquerda - AGORA PRETA */}
        <mesh position={[-0.32, -0.04, 0.12]}>
          <coneGeometry args={[0.15, 0.15, 3, 1]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Seta horizontal - ponta direita - AGORA PRETA */}
        <mesh position={[0.32, -0.04, 0.12]}>
          <coneGeometry args={[0.15, 0.15, 3, 1]} rotation={[0, 0, -Math.PI / 2]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>

      {/* Face traseira com acabamento metálico - ESCURECIDO */}
      <group position={[0, -0.075, 0]} rotation={[Math.PI, 0, 0]}>
        {/* Base da face */}
        <mesh>
          <circleGeometry args={[0.95, 64]} />
          <meshPhysicalMaterial
            color="#303030"
            metalness={0.95}
            roughness={0.15}
            reflectivity={0.9}
            clearcoat={0.2}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Círculo interno com textura diferente - ESCURECIDO */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.7, 64]} />
          <meshPhysicalMaterial
            color="#383838"
            metalness={0.95}
            roughness={0.15}
            reflectivity={0.9}
            clearcoat={0.1}
            clearcoatRoughness={0.3}
          />
        </mesh>

        {/* LINHA HORIZONTAL - AGORA PRETA */}
        <mesh position={[0, -0.1, 0.12]}>
          <boxGeometry args={[0.7, 0.05, 0.12]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Seta horizontal - ponta esquerda - AGORA PRETA */}
        <mesh position={[-0.32, -0.06, 0.12]}>
          <coneGeometry args={[0.15, 0.15, 3, 1]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Seta horizontal - ponta direita - AGORA PRETA */}
        <mesh position={[0.32, -0.06, 0.12]}>
          <coneGeometry args={[0.15, 0.15, 3, 1]} rotation={[0, 0, -Math.PI / 2]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>

      {/* Detalhes na borda - pequenos entalhes decorativos */}
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 24) * Math.PI * 2) * 1, Math.sin((i / 24) * Math.PI * 2) * 1, 0]}
          rotation={[0, 0, (i / 24) * Math.PI * 2]}
          scale={[0.03, 0.1, 0.03]}
        >
          <boxGeometry args={[1, 1, 0.2]} />
          <meshPhysicalMaterial color="#505050" metalness={0.95} roughness={0.15} reflectivity={0.9} clearcoat={0.4} />
        </mesh>
      ))}
    </group>
  )
}
