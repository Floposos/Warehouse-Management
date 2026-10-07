import { buildingTypes, type BuildingTypeId } from '../../content/buildings';
import type { BuildTool } from '../../input/buildTool';
import { formatEuro } from '../../shared/format';
import { buildingCost } from '../../sim/commands/build';
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

  constructor(
    parent: HTMLElement,
    private readonly onTool: (tool: BuildTool | null) => void,
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
    if (tab === 'zones') this.panel.append(...this.buildingItems());
    else if (tab === 'roads' || tab === 'vehicles') {
      this.panel.append(el('span', 'buildbar-empty', de.build.comingSoon));
    }
  }

  private buildingItems(): HTMLElement[] {
    return (Object.keys(buildingTypes) as BuildingTypeId[]).map((type) => {
      const name = de.build.buildings[type];
      const cost = formatEuro(buildingCost(type));
      const item = button('', () => this.selectBuilding(type), 'btn buildbar-item');
      item.append(el('span', 'buildbar-item-name', name), el('span', 'buildbar-item-cost', cost));
      item.title = de.build.itemTitle(name, cost);
      const active = this.tool?.kind === 'place' && this.tool.buildingType === type;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
      return item;
    });
  }

  private selectBuilding(type: BuildingTypeId): void {
    const active = this.tool?.kind === 'place' && this.tool.buildingType === type;
    this.onTool(active ? null : { kind: 'place', buildingType: type });
  }
}
