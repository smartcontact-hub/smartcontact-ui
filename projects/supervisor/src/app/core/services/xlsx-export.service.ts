import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { TOAST_LIFE } from '@core/utils/toast-life';
// Solo el tipo: `import type` se borra en compilación, no arrastra `xlsx` al
// bundle. El runtime se carga con `import('xlsx')` diferido (ver `run`).
import type { CellObject } from 'xlsx';

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
 * Shared XLSX export service (port of the React prototype's `exportToXlsx` —
 * DD#296). Builds a styled worksheet (bold grey header row, auto-fit column
 * widths), writes a timestamped file and surfaces a success toast through the
 * PrimeNG `MessageService`.
 */
@Injectable({ providedIn: 'root' })
export class XlsxExportService {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  /** API pública síncrona; el trabajo real (con `xlsx` diferido) corre en `run`. */
  export(options: XlsxExportOptions): void {
    void this.run(options);
  }

  private async run(options: XlsxExportOptions): Promise<void> {
    const { headers, rows, sheetName, filePrefix } = options;

    // Carga diferida: `xlsx` (~280 kB) vive en su propio chunk, descargado solo
    // al exportar — fuera del bundle inicial.
    const XLSX = await import('xlsx');

    const aoa: (string | number)[][] = [[...headers], ...rows.map((row) => [...row])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!cols'] = headers.map((header, columnIndex) => {
      let max = header.length;
      for (const row of rows) {
        const cell = row[columnIndex];
        const len = String(cell ?? '').length;
        if (len > max) max = len;
      }
      return { wch: Math.min(max + 2, 50) };
    });

    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let column = range.s.c; column <= range.e.c; column++) {
      const address = XLSX.utils.encode_cell({ r: 0, c: column });
      const cell = ws[address] as CellObject | undefined;
      if (!cell) continue;
      cell.s = {
        font: { bold: true, sz: 11 },
        fill: { fgColor: { rgb: 'F3F4F6' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'D1D5DB' } } },
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${filePrefix}_${dateStr}.xlsx`);

    const summary = this.translate.instant('common.export_success', {
      count: rows.length,
      sheet: sheetName.toLowerCase(),
    });
    this.messages.add({ severity: 'success', summary, life: TOAST_LIFE.success });
  }
}
