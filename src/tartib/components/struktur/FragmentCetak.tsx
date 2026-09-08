// Baris cetak satu item + sub-tugasnya (sub menjorok dengan ↳) — dipakai blok
// cetak PanelItemSop (Batch Y; dipindah dari SopView pada sesi 22).
// `break-inside-avoid` menjaga satu baris tidak terbelah antar halaman.

import { ambilIkonJabatan, ambilIkonTugas } from '../../lib/ikonKontekstual';
import type { SopItem, SopSubItem } from '../../types';

export function FragmentCetak({ item, subs }: { item: SopItem; subs: SopSubItem[] }) {
  return (
    <>
      <tr className="break-inside-avoid">
        <td className="border border-slate-400 px-2 py-1 text-center">☐</td>
        <td className="border border-slate-400 px-2 py-1 font-medium">
          <span className="mr-1.5 inline-block">{ambilIkonJabatan(item.judul, item.catatan, item.rutin)}</span>
          {item.judul}
        </td>
        <td className="border border-slate-400 px-2 py-1">{item.picNama}</td>
        <td className="border border-slate-400 px-2 py-1">{item.rutin}</td>
        <td className="border border-slate-400 px-2 py-1">{item.catatan}</td>
      </tr>
      {subs.map((s) => (
        <tr key={s.id} className="break-inside-avoid">
          <td className="border border-slate-400 px-2 py-1 text-center">☐</td>
          <td className="border border-slate-400 px-2 py-1">
            ↳ <span className="mr-1 inline-block">{ambilIkonTugas(s.judul, s.catatan)}</span>
            {s.judul}
          </td>
          <td className="border border-slate-400 px-2 py-1">{s.picNama}</td>
          <td className="border border-slate-400 px-2 py-1" />
          <td className="border border-slate-400 px-2 py-1">{s.catatan}</td>
        </tr>
      ))}
    </>
  );
}
