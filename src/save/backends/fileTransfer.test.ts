import { describe, expect, it } from 'vitest';
import { exportFileName } from './fileTransfer';

describe('exportFileName', () => {
  it('erzeugt einen sicheren Dateinamen', () => {
    expect(exportFileName('Mein Campus: Süd/West!', '2000-01-03')).toBe(
      'logistikum-Mein-Campus-SudWest-2000-01-03.json',
    );
    expect(exportFileName('   ', '2000-01-01')).toBe('logistikum-spielstand-2000-01-01.json');
  });
});
