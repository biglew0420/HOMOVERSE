import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
export type PresenceStatus = 'active' | 'idle' | 'offline';
export type Presence = { x: number; z: number; color: string; name: string; status: PresenceStatus };
export type RoomEvent = { type: 'win'; name: string; machine: string; amount: number };
export const PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY as string | undefined;
export const MULTIPLAYER = !!PUBLIC_KEY;
// Demo only. A public key is not authentication: anyone who has it can join the room.
// Real rooms need a Liveblocks secret-key auth endpoint. Incoming wins are still checked in acceptWinEvent.
const client = createClient({ publicApiKey: PUBLIC_KEY || 'pk_missing' });
export const { RoomProvider, useMyPresence, useOthers, useBroadcastEvent, useEventListener, useStatus } =
  createRoomContext<Presence, never, never, RoomEvent>(client);
