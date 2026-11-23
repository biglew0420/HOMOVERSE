import { theme } from '../lib/theme';

export function Head({ skin, y = 0 }: { skin: string; y?: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.135, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.13, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.1, 12]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.02, 0.13]} castShadow>
        <sphereGeometry args={[0.028, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[-0.13, 0.01, 0.02]} rotation={[0, 0, 0.35]} castShadow>
        <sphereGeometry args={[0.03, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[0.13, 0.01, 0.02]} rotation={[0, 0, -0.35]} castShadow>
        <sphereGeometry args={[0.03, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
    </group>
  );
}

export function GoldHPin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.022, 0.07, 0.016]} />
        <meshStandardMaterial color={theme.gold} metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0.026, 0, 0]}>
        <boxGeometry args={[0.022, 0.07, 0.016]} />
        <meshStandardMaterial color={theme.gold} metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0.013, 0.005, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.02, 0.042, 0.014]} />
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
