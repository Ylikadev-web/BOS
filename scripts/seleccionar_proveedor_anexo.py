#!/usr/bin/env python3
"""
Agrega columnas de proveedor y precio seleccionado a la hoja 1 de un anexo técnico,
replicando la lógica aplicada en la hoja 2.

Reglas de selección:
- Si hay dos precios y la diferencia es extrema (ratio >= umbral), se usa el monto alto
  (suele indicar cotización por caja vs. por pieza).
- Si hay dos precios con diferencia razonable, se usa el monto bajo (mejor precio).
- Si solo hay un precio, se usa ese monto si parece coherente con partidas similares.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from openpyxl import load_workbook

# Proveedores típicos en este anexo (columna I = PEFSA, columna J = PHILCO)
DEFAULT_SUPPLIERS = ("PEFSA", "PHILCO")
EXTREME_RATIO_THRESHOLD = 5.0
PROVEEDOR_HEADERS = (
    "proveedor seleccionado",
    "proveedor",
    "prov. seleccionado",
    "prov seleccionado",
)
PRECIO_HEADERS = (
    "precio seleccionado",
    "precio unitario seleccionado",
    "precio",
    "importe seleccionado",
)


@dataclass
class SheetLayout:
    header_row: int
    desc_col: int
    unit_col: int
    price_cols: list[int]
    supplier_names: list[str]
    proveedor_col: int | None = None
    precio_col: int | None = None
    observaciones_col: int | None = None


def normalize(text: object) -> str:
    if text is None:
        return ""
    value = str(text).strip().lower()
    value = (
        value.replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ü", "u")
    )
    return re.sub(r"\s+", " ", value)


def parse_price(value: object) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value) if float(value) > 0 else None
    text = str(value).strip()
    if not text or text in {"-", "N/A", "n/a", "S/D", "s/d"}:
        return None
    cleaned = re.sub(r"[^\d.,-]", "", text)
    if not cleaned:
        return None
    if cleaned.count(",") == 1 and cleaned.count(".") == 0:
        cleaned = cleaned.replace(",", ".")
    elif cleaned.count(",") >= 1 and cleaned.count(".") >= 1:
        cleaned = cleaned.replace(",", "")
    try:
        number = float(cleaned)
    except ValueError:
        return None
    return number if number > 0 else None


def is_header_match(cell_value: object, candidates: tuple[str, ...]) -> bool:
    text = normalize(cell_value)
    return any(candidate in text for candidate in candidates)


def find_header_row(ws, max_scan: int = 25) -> int | None:
    for row in range(1, min(ws.max_row, max_scan) + 1):
        hits = 0
        for col in range(1, min(ws.max_column, 20) + 1):
            text = normalize(ws.cell(row, col).value)
            if any(token in text for token in ("descripcion", "concepto", "partida", "cantidad", "precio", "proveedor")):
                hits += 1
        if hits >= 2:
            return row
    return None


def detect_price_columns(ws, header_row: int) -> list[int]:
    cols: list[int] = []
    for col in range(1, ws.max_column + 1):
        for row in range(max(1, header_row - 2), header_row + 4):
            value = ws.cell(row, col).value
            if value is None:
                continue
            text = normalize(value)
            if "precio" in text or "importe" in text or "unitario" in text:
                cols.append(col)
                break
            if text in {"pefsa", "philco", "proveedor 1", "proveedor 2", "cotizacion 1", "cotizacion 2"}:
                cols.append(col)
                break
    if cols:
        return sorted(set(cols))

    # Fallback: columnas I (9) y J (10) usadas en el anexo compartido
    fallback = [9, 10]
    if any(parse_price(ws.cell(header_row + 1, col).value) for col in fallback):
        return fallback
    return []


def detect_supplier_names(ws, header_row: int, price_cols: list[int]) -> list[str]:
    names: list[str] = []
    for col in price_cols:
        name = None
        for row in range(max(1, header_row - 3), header_row + 1):
            text = normalize(ws.cell(row, col).value)
            if text in {"pefsa", "philco"}:
                name = text.upper()
                break
            if "pefsa" in text:
                name = "PEFSA"
                break
            if "philco" in text:
                name = "PHILCO"
                break
        names.append(name or DEFAULT_SUPPLIERS[min(len(names), len(DEFAULT_SUPPLIERS) - 1)])
    return names


def detect_existing_selection_columns(ws, header_row: int) -> tuple[int | None, int | None]:
    proveedor_col = None
    precio_col = None
    for col in range(1, ws.max_column + 1):
        header = normalize(ws.cell(header_row, col).value)
        if proveedor_col is None and is_header_match(header, PROVEEDOR_HEADERS):
            proveedor_col = col
        if precio_col is None and is_header_match(header, PRECIO_HEADERS):
            precio_col = col
    return proveedor_col, precio_col


def detect_desc_and_unit_cols(ws, header_row: int) -> tuple[int, int]:
    desc_col = 2
    unit_col = 4
    for col in range(1, min(ws.max_column, 15) + 1):
        header = normalize(ws.cell(header_row, col).value)
        if "descripcion" in header or "concepto" in header:
            desc_col = col
        if header in {"u.m.", "um", "unidad", "u. m."} or "unidad" in header:
            unit_col = col
    return desc_col, unit_col


def analyze_sheet(ws) -> SheetLayout | None:
    header_row = find_header_row(ws)
    if header_row is None:
        return None

    desc_col, unit_col = detect_desc_and_unit_cols(ws, header_row)
    price_cols = detect_price_columns(ws, header_row)
    if not price_cols:
        return None

    supplier_names = detect_supplier_names(ws, header_row, price_cols)
    proveedor_col, precio_col = detect_existing_selection_columns(ws, header_row)

    return SheetLayout(
        header_row=header_row,
        desc_col=desc_col,
        unit_col=unit_col,
        price_cols=price_cols,
        supplier_names=supplier_names,
        proveedor_col=proveedor_col,
        precio_col=precio_col,
    )


def extract_box_factor(description: str, unit: str) -> int | None:
    text = f"{description} {unit}".upper()
    match = re.search(r"C/\s*(\d+)", text)
    if match:
        return int(match.group(1))
    match = re.search(r"(\d+)\s*PIEZAS", text)
    if match:
        return int(match.group(1))
    if "CAJA" in unit.upper():
        return 25
    return None


def choose_price(
    prices: list[tuple[str, float]],
    description: str,
    unit: str,
    reference_prices: list[float],
) -> tuple[str, float, str]:
    available = [(supplier, price) for supplier, price in prices if price is not None]
    if not available:
        return "", 0.0, "Sin precio"

    if len(available) == 1:
        supplier, price = available[0]
        if reference_prices:
            median_ref = sorted(reference_prices)[len(reference_prices) // 2]
            if price > median_ref * 50:
                return supplier, price, "Unico precio (alto, revisar unidad)"
            if price < median_ref / 50:
                return supplier, price, "Unico precio (bajo, revisar unidad)"
        return supplier, price, "Unico precio disponible"

    (sup_a, price_a), (sup_b, price_b) = available[0], available[1]
    low_sup, low_price = (sup_a, price_a) if price_a <= price_b else (sup_b, price_b)
    high_sup, high_price = (sup_b, price_b) if price_a <= price_b else (sup_a, price_a)
    ratio = high_price / low_price if low_price else float("inf")

    box_factor = extract_box_factor(description, unit)
    if box_factor and ratio >= 3:
        expected_piece = high_price / box_factor
        if abs(expected_piece - low_price) / max(low_price, 1) <= 0.35:
            return high_sup, high_price, f"Diferencia extrema: caja x{box_factor} vs pieza"

    if ratio >= EXTREME_RATIO_THRESHOLD:
        return high_sup, high_price, f"Diferencia extrema (x{ratio:.1f}), se usa monto alto"

    return low_sup, low_price, f"Precio competitivo (x{ratio:.2f})"


def ensure_selection_columns(ws, layout: SheetLayout, reference_layout: SheetLayout | None) -> SheetLayout:
    proveedor_col = layout.proveedor_col
    precio_col = layout.precio_col
    observaciones_col = layout.observaciones_col

    if reference_layout:
        if reference_layout.proveedor_col:
            proveedor_col = proveedor_col or reference_layout.proveedor_col
        if reference_layout.precio_col:
            precio_col = precio_col or reference_layout.precio_col
        if reference_layout.observaciones_col:
            observaciones_col = observaciones_col or reference_layout.observaciones_col

    if proveedor_col is None or precio_col is None:
        start_col = max(layout.price_cols) + 1
        proveedor_col = proveedor_col or start_col
        precio_col = precio_col or start_col + 1

    header_row = layout.header_row
    ws.cell(header_row, proveedor_col, "PROVEEDOR SELECCIONADO")
    ws.cell(header_row, precio_col, "PRECIO SELECCIONADO")

    if observaciones_col is None:
        observaciones_col = max(proveedor_col, precio_col) + 1
    ws.cell(header_row, observaciones_col, "OBSERVACIONES")

    layout.proveedor_col = proveedor_col
    layout.precio_col = precio_col
    layout.observaciones_col = observaciones_col
    return layout


def collect_reference_prices(ws, layout: SheetLayout) -> list[float]:
    refs: list[float] = []
    for row in range(layout.header_row + 1, ws.max_row + 1):
        desc = ws.cell(row, layout.desc_col).value
        if not desc or not str(desc).strip():
            continue
        for col in layout.price_cols:
            price = parse_price(ws.cell(row, col).value)
            if price:
                refs.append(price)
    return refs


def process_sheet(ws, layout: SheetLayout, reference_layout: SheetLayout | None = None) -> int:
    layout = ensure_selection_columns(ws, layout, reference_layout)
    reference_prices = collect_reference_prices(ws, layout)
    updated = 0

    for row in range(layout.header_row + 1, ws.max_row + 1):
        desc = ws.cell(row, layout.desc_col).value
        if desc is None or not str(desc).strip():
            continue

        unit = str(ws.cell(row, layout.unit_col).value or "")
        prices: list[tuple[str, float | None]] = []
        for idx, col in enumerate(layout.price_cols):
            supplier = layout.supplier_names[idx] if idx < len(layout.supplier_names) else f"PROV{idx + 1}"
            prices.append((supplier, parse_price(ws.cell(row, col).value)))

        valid_prices = [(s, p) for s, p in prices if p is not None]
        if not valid_prices:
            continue

        supplier, price, reason = choose_price(valid_prices, str(desc), unit, reference_prices)

        proveedor_cell = ws.cell(row, layout.proveedor_col)
        precio_cell = ws.cell(row, layout.precio_col)
        obs_cell = ws.cell(row, layout.observaciones_col)

        if proveedor_cell.value != supplier:
            proveedor_cell.value = supplier
            updated += 1
        if precio_cell.value != price:
            precio_cell.value = price
            precio_cell.number_format = '"$"#,##0.00'
            updated += 1
        if len(valid_prices) == 1:
            reason = f"{reason}; sin cotización de competencia"
        if obs_cell.value != reason:
            obs_cell.value = reason
            updated += 1

    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description="Selecciona proveedor y precio en anexo técnico.")
    parser.add_argument("archivo", type=Path, help="Ruta al archivo .xlsx")
    parser.add_argument("--hoja-origen", default="2", help="Hoja de referencia (default: 2)")
    parser.add_argument("--hoja-destino", default="1", help="Hoja a completar (default: 1)")
    parser.add_argument("-o", "--output", type=Path, help="Archivo de salida (default: sobrescribe)")
    args = parser.parse_args()

    if not args.archivo.exists():
        print(f"No se encontró el archivo: {args.archivo}", file=sys.stderr)
        return 1

    wb = load_workbook(args.archivo)
    sheet_names = wb.sheetnames

    def resolve_sheet(name: str):
        if name in sheet_names:
            return wb[name]
        if name.isdigit():
            idx = int(name) - 1
            if 0 <= idx < len(sheet_names):
                return wb[sheet_names[idx]]
        raise SystemExit(f"Hoja no encontrada: {name}. Disponibles: {', '.join(sheet_names)}")

    ws_ref = resolve_sheet(args.hoja_origen)
    ws_dest = resolve_sheet(args.hoja_destino)

    ref_layout = analyze_sheet(ws_ref)
    dest_layout = analyze_sheet(ws_dest)

    if ref_layout is None:
        print(f"No se pudo analizar la hoja de referencia '{ws_ref.title}'.", file=sys.stderr)
        return 1
    if dest_layout is None:
        print(f"No se pudo analizar la hoja destino '{ws_dest.title}'.", file=sys.stderr)
        return 1

    updated = process_sheet(ws_dest, dest_layout, ref_layout)

    output = args.output or args.archivo
    wb.save(output)
    print(f"Listo. Partidas actualizadas en '{ws_dest.title}': {updated}")
    print(f"Archivo guardado en: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
