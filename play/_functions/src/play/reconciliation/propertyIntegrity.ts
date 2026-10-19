export interface ReconciliationProperty {
  id: string;
  property_status?: unknown;
  tradable?: unknown;
}

export function findInvalidIncompletePropertyIds(properties: ReconciliationProperty[]): string[] {
  return properties
    .filter((property) => property.property_status === 'INCOMPLETE' && property.tradable !== false)
    .map((property) => property.id)
    .sort();
}
