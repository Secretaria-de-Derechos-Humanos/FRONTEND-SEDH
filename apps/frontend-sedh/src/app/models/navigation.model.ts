export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  badge?: string;
  badgeSeverity?: 'success' | 'info' | 'warning' | 'danger';
  divider?: boolean;
}
