import { theme } from '../lib/theme';

export function Head({ skin, y = 0 }: { skin: string; y?: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow scale={[0.94, 1.06, 0.98]}>
        <sphereGeometry args={[0.135, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.48} />
      </mesh>
      <mesh position={[0, -0.07, 0.02]} scale={[0.82, 0.7, 0.78]} castShadow>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.145, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 0.1, 12]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.015, 0.125]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.012, 0.03, 4, 8]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[-0.125, 0.0, 0.01]} rotation={[0, 0.4, 0.2]} castShadow>
        <sphereGeometry args={[0.028, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[0.125, 0.0, 0.01]} rotation={[0, -0.4, -0.2]} castShadow>
        <sphereGeometry args={[0.028, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      {[[-0.046, 0.02], [0.046, 0.02]].map(([x, yEye]) => (
        <group key={x} position={[x, yEye, 0.118]}>
          <mesh>
            <sphereGeometry args={[0.028, 10, 8]} />
            <meshStandardMaterial color="#f4efe8" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <sphereGeometry args={[0.011, 8, 8]} />
            <meshStandardMaterial color="#1a120e" roughness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.046, 0.05, 0.12]} rotation={[0, 0, 0.35]}>
        <capsuleGeometry args={[0.005, 0.028, 3, 6]} />
        <meshStandardMaterial color="#3a2a24" roughness={0.6} />
      </mesh>
      <mesh position={[0.046, 0.05, 0.12]} rotation={[0, 0, -0.35]}>
        <capsuleGeometry args={[0.005, 0.028, 3, 6]} />
        <meshStandardMaterial color="#3a2a24" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.055, 0.112]} rotation={[0.4, 0, 0]}>
        <capsuleGeometry args={[0.008, 0.028, 3, 6]} />
        <meshStandardMaterial color="#a56b6b" roughness={0.45} />
      </mesh>
    </group>
  );
}

export function GoldHPin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <capsuleGeometry args={[0.008, 0.05, 3, 6]} />
        <meshStandardMaterial color={theme.gold} metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0.026, 0, 0]}>
        <capsuleGeometry args={[0.008, 0.05, 3, 6]} />
        <meshStandardMaterial color={theme.gold} metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0.013, 0.004, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.007, 0.02, 3, 6]} />
        <meshStandardMaterial color={theme.gold} metalness={0.92} roughness={0.18} />
      </mesh>
    </group>
  );
}

export function Collar({ color, y = 1.36 }: { color: string; y?: number }) {
  return (
    <mesh position={[0, y, 0.04]} rotation={[0.15, 0, 0]} castShadow>
      <torusGeometry args={[0.14, 0.025, 8, 16, Math.PI]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}
