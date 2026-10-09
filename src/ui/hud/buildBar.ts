import { buildConfig } from '../../config/build';
import { maintenanceConfig } from '../../config/maintenance';
import { leaseConfig } from '../../config/vehicles';
import { zoneConfig } from '../../config/zones';
import { buildingTypes, type BuildingTypeId } from '../../content/buildings';
import {
  vehicleDrives,
  vehicleModels,
  type VehicleDrive,
  type VehicleModel,
} from '../../content/vehicleTypes';
import { zoneKinds } from '../../content/zones';
import type { BuildTool } from '../../input/buildTool';
import { formatEuro } from '../../shared/format';
import { buildingCost } from '../../sim/commands/build';
import { acquisitionCents, modelValues } from '../../sim/vehicles/fleet';
import { button, el } from '../components/dom';
import { de } from '../texts/de';

type Tab = keyof typeof de.build.tabs;
const TABS: readonly Tab[] = ['roads', 'zones', 'vehicles', 'demolish'];

/**
 * Bauleiste unten mittig mit Reitern (Entscheidung 07.10.2026). Ein Reiter klappt
 * darüber seine Einträge auf; „Abriss“ schaltet direkt das Abriss-Werkzeug.
 * Wählt nur Werkzeuge; gebaut wird über Befehle im BuildController.
 */
export class BuildBar {
  readonly root = el('div', 'buildbar');
  private readonly panel = el('div', 'buildbar-panel');
  private readonly tabButtons = new Map<Tab, HTMLButtonElement>();
  private openTab: Tab | null = null;
  private tool: BuildTool | null = null;
  private lease = false;

  constructor(
    parent: HTMLElement,
    private readonly onTool: (tool: BuildTool | null) => void,
    private readonly onBuy: (model: VehicleModel, drive: VehicleDrive, lease: boolean) => void,
  ) {
    this.root.dataset['testid'] = 'build-bar';
    this.root.setAttribute('aria-label', de.build.barLabel);
    const tabs = el('div', 'buildbar-tabs');
    for (const tab of TABS) {
      const b = button(de.build.tabs[tab], () => this.clickTab(tab), 'btn buildbar-tab');
      this.tabButtons.set(tab, b);
      tabs.append(b);
    }
    this.panel.hidden = true;
    this.root.append(this.panel, tabs);
    this.root.hidden = true;
    parent.append(this.root);
  }

  set visible(v: boolean) {
    this.root.hidden = !v;
  }

  /** Zeigt das aktive Werkzeug an (auch wenn es von außen beendet wurde, z. B. per Esc). */
  setTool(tool: BuildTool | null): void {
    this.tool = tool;
    if (!tool && this.openTab === 'demolish') this.openTab = null;
    this.render();
  }

  private clickTab(tab: Tab): void {
    if (tab === 'demolish') {
      const active = this.tool?.kind === 'demolish';
      this.openTab = active ? null : 'demolish';
      this.onTool(active ? null : { kind: 'demolish' });
      return;
    }
    this.openTab = this.openTab === tab ? null : tab;
    if (this.tool) this.onTool(null);
    else this.render();
  }

  private render(): void {
    for (const [tab, b] of this.tabButtons) {
      const active = tab === this.openTab;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    }
    this.panel.replaceChildren();
    const tab = this.openTab;
    this.panel.hidden = tab === null || tab === 'demolish';
    if (tab === 'zones') this.panel.append(...this.zoneItems(), ...this.buildingItems());
    else if (tab === 'roads') this.panel.append(this.roadItem(), ...this.priorityItems());
    else if (tab === 'vehicles') this.panel.append(this.paymentSwitch(), ...this.vehicleItems());
  }

  private buildingItems(): HTMLElement[] {
    return (Object.keys(buildingTypes) as BuildingTypeId[]).map((type) => {
      const name = de.build.buildings[type];
      const cost = formatEuro(buildingCost(type));
      const active = this.tool?.kind === 'place' && this.tool.buildingType === type;
      return this.item(name, cost, de.build.itemTitle(name, cost), active, {
        kind: 'place',
        buildingType: type,
      });
    });
  }

  private zoneItems(): HTMLElement[] {
    return zoneKinds.map((kind) => {
      const name = de.build.zones[kind];
      const cost = de.build.zoneItemCost(formatEuro(zoneConfig.costPerFieldCents[kind]));
      const active = this.tool?.kind === 'zone' && this.tool.zoneKind === kind;
      const title =
        kind === 'W'
          ? de.build.workshopItemTitle(maintenanceConfig.workshopFieldsPerBay)
          : de.build.zoneItemTitle(name);
      return this.item(name, cost, title, active, {
        kind: 'zone',
        zoneKind: kind,
      });
    });
  }

  private roadItem(): HTMLElement {
    const cost = de.build.roadItemCost(formatEuro(buildConfig.roadCostPerTileCents));
    const active = this.tool?.kind === 'road';
    return this.item(de.build.road, cost, de.build.roadItemTitle, active, { kind: 'road' });
  }

  /** Vorfahrtsstraße markieren und Markierung entfernen (T2.2). */
  private priorityItems(): HTMLElement[] {
    return [true, false].map((priority) => {
      const active = this.tool?.kind === 'priority' && this.tool.priority === priority;
      const name = priority ? de.build.priority : de.build.priorityRemove;
      const title = priority ? de.build.priorityTitle : de.build.priorityRemoveTitle;
      return this.item(name, de.build.priorityCost, title, active, { kind: 'priority', priority });
    });
  }

  /** Kaufen oder Leasen für die Fahrzeug-Einträge daneben (T2.5). */
  private paymentSwitch(): HTMLElement {
    const group = el('div', 'buildbar-switch');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', de.fleet.payment);
    for (const lease of [false, true]) {
      const b = button(
        lease ? de.fleet.lease : de.fleet.buy,
        () => {
          this.lease = lease;
          this.render();
        },
        'btn buildbar-switch-btn',
      );
      b.title = lease
        ? de.fleet.leaseTitle(leaseConfig.termMonths, leaseConfig.earlyReturnPenaltyMonths)
        : de.fleet.buyTitle;
      b.classList.toggle('is-active', lease === this.lease);
      b.setAttribute('aria-pressed', String(lease === this.lease));
      group.append(b);
    }
    return group;
  }

  /** Fahrzeug anschaffen ist kein Werkzeug: Klick kauft/least sofort, es erscheint an der Einfahrt. */
  private vehicleItems(): HTMLElement[] {
    return vehicleModels.flatMap((model) =>
      vehicleDrives.map((drive) => {
        const v = modelValues(model, drive);
        const amount = formatEuro(acquisitionCents(model, drive, this.lease));
        const cost = this.lease ? de.fleet.perMonth(amount) : amount;
        const name = de.fleet.itemName(de.fleet.models[model], de.fleet.drives[drive]);
        const item = button('', () => this.onBuy(model, drive, this.lease), 'btn buildbar-item');
        item.dataset['testid'] = `buy-${model}-${drive}`;
        item.append(el('span', 'buildbar-item-name', name), el('span', 'buildbar-item-cost', cost));
        item.title = de.fleet.itemTitle(
          name,
          v.capacity,
          cost,
          formatEuro(v.dailyCents),
          formatEuro(v.costPerKmCents),
        );
        return item;
      }),
    );
  }

  /** Eintrag im aufgeklappten Reiter; erneuter Klick auf den aktiven Eintrag beendet das Werkzeug. */
  private item(
    name: string,
    cost: string,
    title: string,
    active: boolean,
    tool: BuildTool,
  ): HTMLElement {
    const item = button('', () => this.onTool(active ? null : tool), 'btn buildbar-item');
    item.append(el('span', 'buildbar-item-name', name), el('span', 'buildbar-item-cost', cost));
    item.title = title;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
    return item;
  }
}
