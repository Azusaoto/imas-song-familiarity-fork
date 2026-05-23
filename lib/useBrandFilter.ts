/**
 * 共用 hook：依目前選的 brand 算出允許的 production 集合，
 * 過濾偶像 / 組合下拉選項，並在 brand 改變時連帶移除不再合法的選取。
 *
 * 規則：
 * - 沒選 brand → 不過濾(顯示全部)
 * - 任一 brand 是「不限制」(godo / cover / remix) → 不過濾
 * - 否則取所有選中 brand 對應 production 的聯集
 * - unit.production === 'mixed' 視為跨 IP，永遠允許
 */
import { useMemo } from 'react';
import { brandToProduction, shouldFilterByProduction } from './brandMap';

interface ProductionAware {
  id: string;
  production?: string | null;
}

export interface UseBrandFilterArgs<I extends ProductionAware, U extends ProductionAware> {
  selectedBrands: string[];
  allIdols: I[];
  allUnits: U[];
  setSelectedBrands: (next: string[]) => void;
  setSelectedIdols: (updater: (prev: string[]) => string[]) => void;
  setSelectedUnits: (updater: (prev: string[]) => string[]) => void;
}

export interface UseBrandFilterReturn<I, U> {
  /** null = 不限制；Set = 只允許這些 production */
  allowedProductions: Set<string> | null;
  filteredIdols: I[];
  filteredUnits: U[];
  /** 包到 MultiSelect 的 onChange — 會 setSelectedBrands + 清掉非法的偶像/組合選取 */
  handleBrandsChange: (next: string[]) => void;
}

export function useBrandFilter<I extends ProductionAware, U extends ProductionAware>(
  args: UseBrandFilterArgs<I, U>,
): UseBrandFilterReturn<I, U> {
  const { selectedBrands, allIdols, allUnits, setSelectedBrands, setSelectedIdols, setSelectedUnits } = args;

  const allowedProductions = useMemo<Set<string> | null>(() => {
    if (selectedBrands.length === 0) return null;
    const acc = new Set<string>();
    for (const b of selectedBrands) {
      if (!shouldFilterByProduction(b)) return null;
      for (const p of brandToProduction[b]) acc.add(p);
    }
    return acc;
  }, [selectedBrands]);

  const filteredIdols = useMemo(() => {
    if (allowedProductions === null) return allIdols;
    return allIdols.filter((i) => i.production && allowedProductions.has(i.production));
  }, [allIdols, allowedProductions]);

  const filteredUnits = useMemo(() => {
    if (allowedProductions === null) return allUnits;
    return allUnits.filter(
      (u) => u.production === 'mixed' || (u.production && allowedProductions.has(u.production)),
    );
  }, [allUnits, allowedProductions]);

  function handleBrandsChange(next: string[]) {
    setSelectedBrands(next);
    if (next.length === 0) return;

    const newAllowed = new Set<string>();
    let unrestricted = false;
    for (const b of next) {
      if (!shouldFilterByProduction(b)) {
        unrestricted = true;
        break;
      }
      for (const p of brandToProduction[b]) newAllowed.add(p);
    }
    if (unrestricted) return;

    setSelectedIdols((prev) =>
      prev.filter((id) => {
        const idol = allIdols.find((x) => x.id === id);
        return !!(idol && idol.production && newAllowed.has(idol.production));
      }),
    );
    setSelectedUnits((prev) =>
      prev.filter((id) => {
        const u = allUnits.find((x) => x.id === id);
        return !!(u && (u.production === 'mixed' || (u.production && newAllowed.has(u.production))));
      }),
    );
  }

  return { allowedProductions, filteredIdols, filteredUnits, handleBrandsChange };
}
