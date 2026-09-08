'use client';

// Hook reaktif untuk papan klip internal — komponen yang memakainya dirender
// ulang saat klip berubah (mis. kartu yang sedang "dipotong" diberi tanda,
// pil "Klip: …" muncul/hilang).

import { useSyncExternalStore } from 'react';
import { ambilKlip, subscribeKlip, type ItemKlip } from './appClipboard';

function ambilKosong(): ItemKlip | null {
  return null;
}

export function useKlip(): ItemKlip | null {
  return useSyncExternalStore(subscribeKlip, ambilKlip, ambilKosong);
}
