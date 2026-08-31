import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { TOAST_LIFE } from '@core/utils/toast-life';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface XlsxExportOptions {
  /** Header row labels (already translated). */
  readonly headers: readonly string[];
  /** Data rows in the same column order as `headers`. */
  readonly rows: readonly (readonly (string | number)[])[];
  /** Sheet name shown in Excel's tab. Also used in the success toast. */
  readonly sheetName: string;
  /** File-name prefix; the date is appended in `_YYYY-MM-DD` form. */
  readonly filePrefix: string;
}

/**
 * Shared XLSX export service. Builds a styled worksheet (bold grey header row,
 * auto-fit column widths), triggers a timestamped download and surfaces a
 * success toast through the PrimeNG `MessageService`.
 */
@Injectable({ providedIn: 'root' })
export class XlsxExportService {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  /** API pública síncrona; el trabajo real (con `exceljs` diferido) corre en `run`. */
  export(options: XlsxExportOptions): void {
    void this.run(options);
  }

  private async run(options: XlsxExportOptions): Promise<void> {
    const { headers, rows, sheetName, filePrefix } = options;

    // Carga diferida: `exceljs` vive en su propio chunk, descargado solo al
    // exportar — fuera del bundle inicial. Es CommonJS: bajo la interop del
    // bundler los exports cuelgan de `.default`, no del namespace.
    const { default: ExcelJS } = await import('exceljs');

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(sheetName);

    ws.addRow([...headers]);
    for (const row of rows) ws.addRow([...row]);

    headers.forEach((header, columnIndex) => {
      let max = header.length;
      for (const row of rows) {
        const len = String(row[columnIndex] ?? '').length;
        if (len > max) max = len;
      }
      ws.getColumn(columnIndex + 1).width = Math.min(max + 2, 50);
    });

    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([buffer], { type: XLSX_MIME });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePrefix}_${dateStr}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    const summary = this.translate.instant('common.export_success', {
      count: rows.length,
      sheet: sheetName.toLowerCase(),
    });
    this.messages.add({ severity: 'success', summary, life: TOAST_LIFE.success });
  }
}
