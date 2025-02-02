export function getImpactColor(impact: string): string {
  switch (impact.toLowerCase()) {
    case 'high':
      return 'text-trading-danger';
    case 'medium':
      return 'text-trading-warning';
    case 'low':
      return 'text-trading-success';
    default:
      return 'text-gray-400';
  }
}