// Excel download / upload of an IB tier's commission rate matrix.
// exceljs is loaded only when a file is built or read, so it stays out of the page bundle.
import type { CellValue, Workbook } from "exceljs";

export type SymbolCategory = "MAJORS" | "MINORS" | "METALS" | "ENERGIES" | "INDICES" | "CRYPTO";

export const CATEGORY_LABELS: Record<SymbolCategory, string> = {
  MAJORS: "Majors",
  MINORS: "Minors",
  METALS: "Metals",
  ENERGIES: "Gas & Oil",
  INDICES: "Indices",
  CRYPTO: "Crypto",
};

export type RateRow = { symbolId: string; category: SymbolCategory; rates: { [acc: string]: number } };
export type ExcelAccountType = { id: string; name: string };

const SHEET_NAME = "Rates";
const SYMBOL_HEADER = "Symbol";
const GROUP_HEADER = "Group";
// "Standard [3]": the id in brackets is what the upload matches on, so renaming
// an account type later does not break a file downloaded before.
const accountHeader = (acc: ExcelAccountType) => `${acc.name} [${acc.id}]`;

const loadExcel = async () => (await import("exceljs")).default;

export async function downloadRatesExcel(
  rows: RateRow[],
  accountTypes: ExcelAccountType[],
  fileName: string
) {
  const ExcelJS = await loadExcel();
  const wb: Workbook = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(SHEET_NAME, { views: [{ state: "frozen", ySplit: 1 }] });

  ws.columns = [
    { header: SYMBOL_HEADER, key: "symbol", width: 16 },
    { header: GROUP_HEADER, key: "group", width: 14 },
    ...accountTypes.map((acc) => ({ header: accountHeader(acc), key: acc.id, width: 20 })),
  ];
  ws.getRow(1).font = { bold: true };

  rows.forEach((row) => {
    ws.addRow({
      symbol: row.symbolId,
      group: CATEGORY_LABELS[row.category],
      ...Object.fromEntries(accountTypes.map((acc) => [acc.id, Number(row.rates[acc.id] ?? 0)])),
    });
  });
  accountTypes.forEach((_, i) => {
    ws.getColumn(3 + i).numFmt = "0.00";
  });

  const help = wb.addWorksheet("How to use");
  help.getColumn(1).width = 110;
  [
    "Edit the Rates sheet, then upload it on the rate card page.",
    "Symbol: the ticker, e.g. EURUSD. One row per symbol; a symbol may appear only once.",
    `Group: one of ${Object.values(CATEGORY_LABELS).join(", ")}. Only used to group the table on screen.`,
    "One column per account type: USD paid to the IB per closed lot. Numbers of 0 or more; an empty cell counts as 0.",
    "Do not change the account type headers: the [number] in each one is the account type's id.",
    "The uploaded file replaces the whole rate card: a symbol left out of the file is removed from it.",
  ].forEach((line) => help.addRow([line]));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const cellText = (value: CellValue): string => {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("result" in value) return cellText(value.result as CellValue);
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
    if ("text" in value) return String(value.text);
    if (value instanceof Date) return value.toISOString();
    return "";
  }
  return String(value).trim();
};

const toCategory = (text: string, symbol: string, fallback: (s: string) => SymbolCategory): SymbolCategory => {
  const t = text.trim().toLowerCase();
  const hit = (Object.keys(CATEGORY_LABELS) as SymbolCategory[]).find(
    (c) => c.toLowerCase() === t || CATEGORY_LABELS[c].toLowerCase() === t
  );
  return hit ?? fallback(symbol);
};

export type ParsedRates = { rows: RateRow[]; errors: string[]; warnings: string[] };

/**
 * Reads a rate matrix back. Rates are read only for `accountTypes` (the ones
 * that earn commission); a column for any other type is reported and ignored.
 * An eligible type with no column keeps the rates it has now.
 */
export async function parseRatesExcel(
  file: File,
  accountTypes: ExcelAccountType[],
  current: RateRow[],
  categoryOf: (symbol: string) => SymbolCategory
): Promise<ParsedRates> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ExcelJS = await loadExcel();
  const wb: Workbook = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    return { rows: [], errors: ["This file could not be read. Upload an .xlsx file."], warnings };
  }
  const ws = wb.getWorksheet(SHEET_NAME) ?? wb.worksheets[0];
  if (!ws) return { rows: [], errors: ["The file has no sheet."], warnings };

  // Header row: find the Symbol and Group columns and one column per account type.
  const header = ws.getRow(1);
  let symbolCol = 0;
  let groupCol = 0;
  const accountCols: Array<{ col: number; id: string }> = [];
  header.eachCell((cell, col) => {
    const text = cellText(cell.value);
    const lower = text.toLowerCase();
    if (lower === SYMBOL_HEADER.toLowerCase()) symbolCol = col;
    else if (lower === GROUP_HEADER.toLowerCase()) groupCol = col;
    else if (text) {
      const idMatch = text.match(/\[([^\]]+)\]\s*$/);
      const byId = idMatch && accountTypes.find((a) => a.id === idMatch[1].trim());
      const byName = accountTypes.find((a) => a.name.toLowerCase() === text.replace(/\s*\[[^\]]*\]\s*$/, "").toLowerCase());
      const acc = byId || byName;
      if (acc) accountCols.push({ col, id: acc.id });
      else warnings.push(`Column "${text}" is not an account type that earns commission on this tier, so it was ignored.`);
    }
  });
  if (!symbolCol) {
    return { rows: [], errors: [`The first row must have a "${SYMBOL_HEADER}" column.`], warnings };
  }
  if (accountCols.length === 0) {
    errors.push("No account type columns were found. Download the file again and keep its headers.");
  }
  const missing = accountTypes.filter((a) => !accountCols.some((c) => c.id === a.id));
  if (missing.length > 0 && accountCols.length > 0) {
    warnings.push(
      `No column for ${missing.map((a) => a.name).join(", ")}: their current rates are kept (0 for new symbols).`
    );
  }

  const currentBySymbol = new Map(current.map((r) => [r.symbolId, r]));
  const seen = new Set<string>();
  const rows: RateRow[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const symbol = cellText(row.getCell(symbolCol).value).toUpperCase().replace(/\s+/g, "");
    const rateTexts = accountCols.map((c) => cellText(row.getCell(c.col).value));
    if (!symbol) {
      if (rateTexts.some(Boolean)) errors.push(`Row ${rowNumber}: the symbol is empty.`);
      return;
    }
    if (seen.has(symbol)) {
      errors.push(`Row ${rowNumber}: ${symbol} appears more than once.`);
      return;
    }
    seen.add(symbol);

    const existing = currentBySymbol.get(symbol);
    const rates: Record<string, number> = Object.fromEntries(
      accountTypes.map((a) => [a.id, Number(existing?.rates[a.id] ?? 0)])
    );
    accountCols.forEach((c, i) => {
      const text = rateTexts[i];
      const value = text === "" ? 0 : Number(text);
      if (!Number.isFinite(value) || value < 0) {
        errors.push(`Row ${rowNumber}: ${symbol} has "${text}" for an account type. Use a number of 0 or more.`);
        return;
      }
      rates[c.id] = value;
    });

    const groupText = groupCol ? cellText(row.getCell(groupCol).value) : "";
    rows.push({
      symbolId: symbol,
      category: groupText ? toCategory(groupText, symbol, categoryOf) : existing?.category ?? categoryOf(symbol),
      rates,
    });
  });

  if (rows.length === 0 && errors.length === 0) errors.push("The file has no symbols.");
  return { rows, errors, warnings };
}
