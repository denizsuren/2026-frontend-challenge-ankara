// Normalize names for fuzzy matching
// Removes Turkish special chars, lowercases, trims whitespace
function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

// Check if two names are likely the same person
function areSamePerson(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);

  // Exact match after normalization
  if (na === nb) return true;

  // One starts with the other (e.g. "Kagan" vs "Kagan A.")
  if (na.startsWith(nb) || nb.startsWith(na)) return true;

  // First word match (e.g. "Kagan Aydın" vs "Kagan")
  const firstA = na.split(" ")[0];
  const firstB = nb.split(" ")[0];
  if (firstA === firstB && firstA.length > 2) return true;

  return false;
}

// Group all names into clusters of same person
export function groupPeopleByFuzzyMatch(names) {
  const groups = []; // Each group = [canonical name, ...aliases]

  names.forEach((name) => {
    let foundGroup = null;
    for (const group of groups) {
      if (group.some((existing) => areSamePerson(existing, name))) {
        foundGroup = group;
        break;
      }
    }
    if (foundGroup) {
      if (!foundGroup.includes(name)) foundGroup.push(name);
    } else {
      groups.push([name]);
    }
  });

  // Return a map: any alias -> canonical name (first in group)
  const aliasMap = {};
  groups.forEach((group) => {
    const canonical = group[0];
    group.forEach((alias) => {
      aliasMap[alias] = canonical;
    });
  });

  return aliasMap;
}