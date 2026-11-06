import { Html } from '@react-three/drei';
const STATUS = { active: '#3f3', idle: '#fc3', offline: '#777' } as const;
export function Avatar({ x, z, color, name, status }: { x: number; z: number; color: string; name: string; status: keyof typeof STATUS }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]}><capsuleGeometry args={[0.35, 1, 4, 12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 2.1, 0]}><sphereGeometry args={[0.12]} /><meshBasicMaterial color={STATUS[status]} /></mesh>
      <Html position={[0, 2.5, 0]} center style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#fff' }}>{name}</Html>
    </group>
  );
}
