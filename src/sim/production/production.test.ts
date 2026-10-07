import { describe, expect, it } from 'vitest';
import { goodsConfig } from '../../config/goods';
import { productionConfig } from '../../config/production';
import { sellAtExit } from '../goods/export';
import { testWorld, zoneOf } from '../goods/testWorld';
import { zoneStatus } from './production';

describe('Produktkette', () => {
  it('B kombiniert A + B zur Kombi in der eingestellten Dauer', () => {
    const s = testWorld();
    const b = zoneOf(s, 'B');
    expect(zoneStatus(b)).toBe('waitingInput');
    b.stock = { rawA: 2, rawB: 1, combo: 0 };
    s.run(productionConfig.comboTicksPerUnit - 1);
    expect(b.stock.combo).toBe(0);
    s.step();
    expect(b.stock).toEqual({ rawA: 1, rawB: 0, combo: 1 });
    expect(zoneStatus(b)).toBe('waitingInput');
  });

  it('volles Ausgangslager stoppt die Produktion sichtbar', () => {
    const s = testWorld();
    const b = zoneOf(s, 'B');
    b.stock = { rawA: 5, rawB: 5, combo: 90 };
    expect(zoneStatus(b)).toBe('full');
    s.run(productionConfig.comboTicksPerUnit * 2);
    expect(b.stock).toEqual({ rawA: 5, rawB: 5, combo: 90 });
  });

  it('C verarbeitet Kombi zum Endprodukt, größere Zone schneller', () => {
    const s = testWorld();
    const c = zoneOf(s, 'C');
    const area = c.width * c.depth;
    c.stock = { combo: 3, final: 0 };
    s.run(Math.ceil((productionConfig.finalWorkPerUnit * 3) / area));
    expect(c.stock).toEqual({ combo: 0, final: 3 });

    // Doppelt so große Zone: doppelte Menge in derselben Zeit.
    s.execute({ type: 'zone/place', kind: 'C', fromX: 50, fromZ: 58, toX: 55, toZ: 60 });
    const big = s.state.zones.at(-1);
    if (!big) throw new Error('Zone fehlt');
    big.stock = { combo: 10, final: 0 };
    c.stock = { combo: 10, final: 0 };
    s.run(Math.ceil((productionConfig.finalWorkPerUnit * 3) / area));
    expect(c.stock.final).toBe(3);
    expect(big.stock.final).toBe(6);
  });
});

describe('Export', () => {
  it('Endprodukt ist mehr wert als die Kombi', () => {
    expect(goodsConfig.exportPriceCents.final).toBeGreaterThan(goodsConfig.exportPriceCents.combo);
  });

  it('verkauft Endprodukt zum festen Preis und bucht Export-Erlös', () => {
    const s = testWorld();
    const exit = s.state.buildings.find((b) => b.type === 'exportExit');
    const before = s.state.finance.balanceCents;
    expect(sellAtExit(s.state, s.bus, exit?.id ?? 0, 'final', 4)).toBe(
      4 * goodsConfig.exportPriceCents.final,
    );
    expect(s.state.finance.balanceCents).toBe(before + 4 * goodsConfig.exportPriceCents.final);
    expect(s.state.finance.today.incomeCents.exportRevenue).toBe(
      4 * goodsConfig.exportPriceCents.final,
    );
    expect(sellAtExit(s.state, s.bus, exit?.id ?? 0, 'rawA', 4)).toBeNull();
  });
});
