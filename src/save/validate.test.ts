import { describe, expect, it } from 'vitest';
import { createInitialState } from '../sim/state/gameState';
import { validateState } from './validate';

const zone = {
  id: 2,
  kind: 'A',
  parts: [{ x: 1, z: 1, width: 2, depth: 2, builtTick: 0, paidCents: 0 }],
  gate: 'S',
  stock: { rawA: 5 },
  work: 0,
};

describe('validateState', () => {
  it('akzeptiert einen frischen Zustand und gültige Zonen', () => {
    expect(validateState(createInitialState(1))).toBe(true);
    expect(validateState({ ...createInitialState(1), zones: [zone] })).toBe(true);
  });

  it('lehnt kaputte Zonen ab', () => {
    const state = createInitialState(1);
    expect(validateState({ ...state, zones: undefined })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, kind: 'X' }] })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, gate: 'Q' }] })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, stock: { gold: 1 } }] })).toBe(false);
    const badPart = { x: 1, z: 1, width: 1.5, depth: 2, builtTick: 0, paidCents: 0 };
    expect(validateState({ ...state, zones: [{ ...zone, parts: [badPart] }] })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, parts: [] }] })).toBe(false);
  });

  it('prüft Bestellungen und Fahrzeuge', () => {
    const state = createInitialState(1);
    const order = {
      id: 3,
      product: 'rawA',
      quantity: 10,
      interval: 'daily',
      nextTick: 0,
      blocked: null,
    };
    const vehicle = {
      id: 4,
      kind: 'supplier',
      route: [{ x: -3, z: 61 }],
      progress: 0,
      cargo: { product: 'rawA', quantity: 10 },
      phase: 'toSite',
      targetId: 2,
      timer: 0,
      paidCents: 0,
      heading: 1,
      offRoad: false,
      bayAt: null,
      waitTicks: 0,
    };
    expect(validateState({ ...state, orders: [order], vehicles: [vehicle] })).toBe(true);
    expect(validateState({ ...state, orders: [{ ...order, product: 'combo' }] })).toBe(false);
    expect(validateState({ ...state, orders: [{ ...order, interval: 'hourly' }] })).toBe(false);
    expect(validateState({ ...state, vehicles: [{ ...vehicle, route: [] }] })).toBe(false);
    expect(validateState({ ...state, vehicles: [{ ...vehicle, phase: 'flying' }] })).toBe(false);
    expect(validateState({ ...state, vehicles: [{ ...vehicle, heading: 4 }] })).toBe(false);
    expect(validateState({ ...state, vehicles: [{ ...vehicle, bayAt: 'x' }] })).toBe(false);
  });

  it('prüft eigene LKW samt Auftrag und Touren', () => {
    const state = createInitialState(1);
    const truck = {
      id: 7,
      kind: 'truck',
      route: [{ x: 5, z: 61 }],
      progress: 0,
      cargo: null,
      timer: 3,
      phase: 'toPickup',
      job: { product: 'rawA', fromId: 2, toId: 3, quantity: 20 },
      idleReason: null,
      odometer: 1500,
      tourId: 9,
      tourIndex: 0,
      heading: 0,
      offRoad: true,
      bayAt: 2,
      waitTicks: 5,
      model: 'van',
      drive: 'electric',
      priceCents: 5_850_000,
      boughtTick: 0,
      lease: { monthlyCents: 175_500, nextPaymentTick: 9000, endTick: 90000 },
      upkeep: {
        condition: 38_000,
        wearRest: 400,
        brokenTicks: 0,
        breakdowns: 2,
        lastBreakdownTick: 1200,
        lastServiceTick: null,
        serviceRequested: true,
        warnedNoWorkshop: false,
        workshopId: 2,
      },
    };
    const tour = {
      id: 9,
      name: 'Früh',
      color: 2,
      stops: [{ siteId: 2, action: 'load', product: 'rawA' }],
    };
    const ok = { ...state, vehicles: [truck], tours: [tour] };
    expect(validateState(ok)).toBe(true);
    expect(validateState({ ...ok, vehicles: [{ ...truck, phase: 'toSite' }] })).toBe(false);
    expect(validateState({ ...ok, vehicles: [{ ...truck, tourId: 'x' }] })).toBe(false);
    expect(validateState({ ...ok, vehicles: [{ ...truck, idleReason: 'tired' }] })).toBe(false);
    expect(
      validateState({ ...ok, tours: [{ ...tour, stops: [{ siteId: 2, action: 'x' }] }] }),
    ).toBe(false);
    expect(validateState({ ...ok, tours: undefined })).toBe(false);
    expect(validateState({ ...ok, vehicles: [{ ...truck, model: 'bus' }] })).toBe(false);
    expect(validateState({ ...ok, vehicles: [{ ...truck, phase: 'servicing' }] })).toBe(true);
    const badUpkeep = { ...truck.upkeep, condition: 'gut' };
    expect(validateState({ ...ok, vehicles: [{ ...truck, upkeep: badUpkeep }] })).toBe(false);
    expect(validateState({ ...ok, vehicles: [{ ...truck, lease: { monthlyCents: 1 } }] })).toBe(
      false,
    );
  });

  it('verlangt den Zufallsstrom der Ereignisse', () => {
    expect(validateState({ ...createInitialState(1), eventRng: undefined })).toBe(false);
    expect(validateState({ ...createInitialState(1), entrance: { nextInTick: 1 } })).toBe(false);
  });

  it('lehnt eine kaputte Kasse ab', () => {
    const state = createInitialState(1);
    expect(validateState({ ...state, finance: { balanceCents: 5 } })).toBe(false);
  });
});
