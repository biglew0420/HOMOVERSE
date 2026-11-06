import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
export type Presence = { x: number; z: number; color: string; name: string; status: 'active' | 'idle' };
export type RoomEvent = { type: 'win'; name: string; machine: string; amount: number };
export const PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY as string | undefined;
export const MULTIPLAYER = !!PUBLIC_KEY;
const client = createClient({ publicApiKey: PUBLIC_KEY || 'pk_missing' });
export const { RoomProvider, useMyPresence, useOthers, useBroadcastEvent, useEventListener, useStatus } =
  createRoomContext<Presence, never, never, RoomEvent>(client);
