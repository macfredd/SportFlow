/**
 * Translate inside ECharts `tooltip.formatter` callbacks (not when building options),
 * so labels follow the active language after ngx-echarts merge / lang switch.
 */

/** Keeps ECharts HTML tooltips inside the chart view with edge-aware placement. */
export function containedTooltipPosition(
  point: number[],
  _params: unknown,
  _dom: unknown,
  _rect: unknown,
  size: { contentSize: number[]; viewSize: number[] },
): [number, number] {
  const [cx, cy] = point;
  const [tooltipW, tooltipH] = size.contentSize;
  const [viewW, viewH] = size.viewSize;
  const pad = 10;
  const gap = 12;

  // Prefer right of the cell; pin to left padding when near the Y-axis.
  let x = cx + gap;
  if (x + tooltipW > viewW - pad) {
    x = cx - gap - tooltipW;
  }
  x = Math.max(pad, Math.min(x, viewW - tooltipW - pad));

  let y = cy - tooltipH / 2;
  if (y < pad) {
    y = pad;
  }
  if (y + tooltipH > viewH - pad) {
    y = viewH - tooltipH - pad;
  }

  return [x, y];
}

export interface EchartsTooltipTableRow {
  readonly label: string;
  readonly value: string;
  /** Draw a light separator above this row. */
  readonly separatorBefore?: boolean;
}

const TOOLTIP_TABLE_LABEL_STYLE =
  'padding:4px 14px 4px 0;color:#6B7280;white-space:nowrap;vertical-align:top;font-weight:400;';
const TOOLTIP_TABLE_VALUE_STYLE =
  'padding:4px 0;color:#111827;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:500;';

function escapeTooltipHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Two-column label / value layout for ECharts HTML tooltips. */
export function formatEchartsTooltipTable(rows: readonly EchartsTooltipTableRow[]): string {
  const body = rows
    .map((row) => {
      const border = row.separatorBefore
        ? 'border-top:1px solid #E5E7EB;'
        : '';
      return `<tr>
        <td style="${TOOLTIP_TABLE_LABEL_STYLE}${border}">${escapeTooltipHtml(row.label)}</td>
        <td style="${TOOLTIP_TABLE_VALUE_STYLE}${border}">${escapeTooltipHtml(row.value)}</td>
      </tr>`;
    })
    .join('');
  return `<table style="border-collapse:collapse;width:100%;font-size:11px;line-height:1.35;"><tbody>${body}</tbody></table>`;
}

export const CADENCE_HEATMAP_TOOLTIP_STYLE = {
  appendTo: 'body' as const,
  confine: true,
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: {
    color: '#374151',
    fontSize: 11,
    lineHeight: 16,
  },
  extraCssText:
    'box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1); border-radius: 8px; min-width: 200px; pointer-events: none;',
} as const;
