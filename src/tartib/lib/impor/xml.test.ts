import { describe, expect, it } from 'vitest';
import { parseXmlLite, XmlError } from './xml';

describe('parseXmlLite', () => {
  it('mem-parse elemen sederhana dengan atribut', () => {
    const el = parseXmlLite('<w:document xmlns:w="x"><w:body><w:p a="1">halo</w:p></w:body></w:document>');
    expect(el.nama).toBe('w:document');
    expect(el.atribut['xmlns:w']).toBe('x');
    expect(el.anak[0].nama).toBe('w:body');
    expect(el.anak[0].anak[0].nama).toBe('w:p');
    expect(el.anak[0].anak[0].atribut.a).toBe('1');
    expect(el.anak[0].anak[0].teks).toBe('halo');
  });

  it('mendekode entitas & referensi karakter', () => {
    const el = parseXmlLite('<r><t>a &amp; b &#65; &#x42; &lt;x&gt;</t></r>');
    expect(el.anak[0].teks).toBe('a & b A B <x>');
  });

  it('mendukung self-closing, CDATA, dan komentar', () => {
    const el = parseXmlLite('<!-- sebelum --><root><kosong/><![CDATA[teks <b> mentah ]]><a/></root>');
    expect(el.nama).toBe('root');
    expect(el.anak[0].nama).toBe('kosong');
    expect(el.anak[0].teks).toBe('');
    expect(el.anak[1].nama).toBe('a');
    // CDATA adalah data karakter milik elemen induknya.
    expect(el.teks).toBe('teks <b> mentah ');
  });

  it('mempertahankan urutan anak (teks antar elemen digabung)', () => {
    const el = parseXmlLite('<p><r><t>A</t></r><r><t>B</t></r></p>');
    expect(el.anak.length).toBe(2);
    expect(el.anak[0].anak[0].teks).toBe('A');
    expect(el.anak[1].anak[0].teks).toBe('B');
  });

  it('melempar XmlError untuk XML rusak', () => {
    expect(() => parseXmlLite('<a><b></a>')).toThrow(XmlError);
    expect(() => parseXmlLite('<a>')).toThrow(XmlError);
    expect(() => parseXmlLite('teks tanpa akar')).toThrow(XmlError);
    expect(() => parseXmlLite('<a b="x></a>')).toThrow(XmlError);
  });

  it('melempar bila ada konten di luar akar', () => {
    expect(() => parseXmlLite('<a/> <b/>')).toThrow(XmlError);
  });
});
