export interface FilterableSong {
  brand: string;
  title: string;
  musicType: string;
  members?: Array<{ id?: string; name: string; cvName?: string | null }>;
  units?: Array<{ id: string; name: string }>;
}

export interface FilterCriteria {
  searchQuery: string;
  selectedBrands: string[];
  selectedTypes: string[];
  selectedIdols: string[];
  selectedUnits: string[];
}

export function filterSongs<S extends FilterableSong>(
  songs: S[],
  criteria: FilterCriteria,
): S[] {
  const hasQuery = criteria.searchQuery.trim() !== '';
  const selectedBrandSet = new Set(criteria.selectedBrands);
  const selectedIdolSet = new Set(criteria.selectedIdols);
  const selectedUnitSet = new Set(criteria.selectedUnits);

  return songs.filter((song) => {
    if (!hasQuery && selectedBrandSet.size > 0 && !selectedBrandSet.has(song.brand)) {
      return false;
    }

    if (criteria.selectedTypes.length > 0) {
      const typeStr = song.musicType.toLowerCase();
      const ok = criteria.selectedTypes.some((t) => typeStr.includes(t));
      if (!ok) return false;
    }

    if (selectedIdolSet.size > 0) {
      const ok = (song.members ?? []).some(
        (m) => m.id && selectedIdolSet.has(m.id),
      );
      if (!ok) return false;
    }

    if (selectedUnitSet.size > 0) {
      const ok = (song.units ?? []).some((u) => selectedUnitSet.has(u.id));
      if (!ok) return false;
    }

    if (hasQuery) {
      const query = criteria.searchQuery.toLowerCase();
      const matchTitle = song.title.toLowerCase().includes(query);
      const matchMember = (song.members ?? []).some(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          (m.cvName && m.cvName.toLowerCase().includes(query)),
      );
      const matchUnit = (song.units ?? []).some((u) =>
        u.name.toLowerCase().includes(query),
      );
      if (!matchTitle && !matchMember && !matchUnit) return false;
    }

    return true;
  });
}
