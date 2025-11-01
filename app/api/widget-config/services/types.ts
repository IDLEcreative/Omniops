/**
 * Widget configuration service types
 */

export interface WidgetConfigWithHistory {
  config: any;
  history: any[] | null;
  variants: any[] | null;
}

export interface UpdateData {
  updateData: any;
  changedFields: string[];
}
