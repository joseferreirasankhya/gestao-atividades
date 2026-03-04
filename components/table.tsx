"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { parse, format } from "date-fns";

import { DynamicIcon } from "@/components/ui/DynamicIcon";

// Adicionadas as importações para o container e utilitários
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

let silentReload: (() => void) | null = null;

function updateMitra() {
  silentReload?.();
}

const getIconComponent = (name?: string): string => {
  if (!name) return "HelpCircle"; // fallback

  const nameMap: Record<string, string> = {
    "delete": "Trash2",
    "trash": "Trash2",
    "view": "Eye",
    "copy": "Share",
    "share": "Share",
    "close": "X",
    "cancel": "X",
    "arrow-down": "ArrowDown",
    "arrowup": "ArrowUp",
    "arrow-up": "ArrowUp",
    "warning": "AlertTriangle",
    "error": "AlertCircle",
    "file": "FileText",
    "eye-off": "EyeOff",
    "help": "HelpCircle",
    "alert-circle": "AlertCircle", 
    "image-off": "ImageOff",
    "no-image": "ImageOff",
  };

  const normalized = name.trim().toLowerCase();

  if (nameMap[normalized]) return nameMap[normalized];
  if (/^[A-Z][a-zA-Z0-9]+$/.test(name)) return name;

  const pascal = normalized
    .split(/[-_\s]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

  return pascal || "HelpCircle";
};

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


function waitIndefinitely<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const result = await promise;
        resolve(result);
      } catch (err: any) {
        const message = String(err?.message || err || "").toLowerCase();
        if (message.includes("timeout") || message.includes("aguardar resposta da interação")) {
          console.warn("Timeout ignorado, aguardando indefinidamente a resposta do form...");
          setTimeout(attempt, 1000); 
        } else {
          reject(err);
        }
      }
    };
    attempt();
  });
}

// --- Funções nativas Mitra ---------------------------------
declare function queryMitra(options: {
  query: string;
  jdbcId?: number;
}): Promise<{ headers: { name: string; dataType: string }[]; data: any[][] }>;
declare function setVariableMitra(variable: {
  name: string;
  content: any;
}): Promise<void>;
declare function dbactionMitra(scriptId: number): Promise<void>;
declare function formMitra(options: { id: number; contentId?: any }): void;
declare function modalMitra(options: {
  id: number;
  width?: number;
  height?: number;
}): void;
function safeModalMitra(opts: { id: number; width?: number; height?: number; reload?: boolean; floating?: boolean }) {
  const defaultWidth = parseTamanhoModal.width || 100;
  const defaultHeight = parseTamanhoModal.height || 100;

  const payload: any = {
    id: opts.id,
    width: (opts.width !== undefined ? opts.width : defaultWidth),
    height: (opts.height !== undefined ? opts.height : defaultHeight),
    reload: (opts.reload !== undefined ? opts.reload : false),
    floating: (opts.floating !== undefined ? opts.floating : false),
  };

  if (typeof opts.reload === "boolean") payload.reload = opts.reload;
  if (typeof opts.floating === "boolean") payload.floating = opts.floating;

  modalMitra(payload);
}
  
declare function actionMitra(options: {
  id: number;
}): Promise<void>;

//  --- Tipos ---------------------------------------------------
export interface DataRow {
  ID: number;
  TITULO: string;
  DATA_LIMITE: string;
  TIPOTAREFA: string;
  ID_RESPONSAVEL: string | number | null;
  ID_TESTER: string | number | null;
  STATUS: string | null;
  [key: string]: any;
}

export interface ActionConfigItem {
  label: string;
  isSeparator?: boolean;
  condition?: (rowData: DataRow) => boolean;
  interaction: string;
  setRowIdVariable?: string;
  mitraFormContentIdField?: keyof DataRow | string;
  mitraModalWidth?: number;
  mitraModalHeight?: number;
}

export interface AddButtonConfig {
  label: string;
  icon: string;
  interactionColumn: string;
  bgColor?: string;
  textColor?: string;
}

export interface ColumnDefinition {
  columnName: string;
  headerName?: string;
  dataField: string;
  columnType:
    | "data_text"
    | "data_number"
  | "data_int"
    | "data_boolean_checkbox"
    | "action_button"
    | "input_text"
    | "input_number"
    | "input_date"
    | "input_dropdown"
    | "action_buttons_group"
    | "data_iconphoto";
  position?: number;
  headerAlignment?: "left" | "center" | "right";
  cellAlignment?: "left" | "center" | "right";
  dropdownOptions?: Array<{ label: string; value: string | number | boolean }>;
  dropdownOptionsWithQuery?: string;
  buttonText?: string;
  onValueChangeDBActionID?: number;
  onValueChangeMitraVariable?: string;
  setRowIdForChangeDBAction?: string;
   interactionColumn?: string;
  setRowIdVariableForButton?: string;
  mitraModalWidthForButton?: number;
  mitraModalHeightForButton?: number;
  enableSorting?: boolean;
  enableHiding?: boolean;
  cellClassName?: string;
  width?: string;
  buttonVariant?: "destructive" | "normal";
  disabledControlColumn?: string;
  inputDateFormat?: string;
  imageField?: string;
  iconField?: string;
  imageShape?: 'circle' | 'rounded' | 'square';
  iconColorField?: string;
  iconBgColor1Field?: string;
  iconBgColor2Field?: string;
enableTotalizer?: string;
  alertConfig?: {
    type: "dot" | "bg" | "text";
    rules: Array<{ match: string | number; color: string }>;
    elseColor?: string;
  };

  buttonsGroupConfig?: {
    setRowIdVariable: string;
    buttons: {
      icon: string;
      hoverText: string;
      bgColor?: string;
      iconColor?: string;
      interactionColumn: string;
      queryColumn?: string;
    }[];
  };
}

// ✅ FUNÇÃO AUXILIAR DE ESTILO CONDICIONAL (CORREÇÃO PEDIDA)
const getConditionalTextStyle = (text: string, colDef: ColumnDefinition): React.CSSProperties | undefined => {
  const txt = String(text ?? "");
  
  // Regra original para coluna Data
  if ((colDef.headerName === "Data" || colDef.columnName === "Data") && txt.startsWith("Atrasada há")) {
    return { color: 'red', fontWeight: '600' };
  }

  // Novas regras baseadas em status
  if (txt === "Concluída") return { color: '#16a34a', fontWeight: '600' }; // Verde (Emerald 600)
  if (txt === "Concluída com atraso") return { color: '#f97316', fontWeight: '600' }; // Laranja (Orange 500)
  if (txt === "Conclusão hoje") return { color: '#ca8a04', fontWeight: '600' }; // Amarelo (Yellow 600 para leitura)

  return undefined;
};

// --- Configurações globais ----------------------------------
const TAREFA_SQL_QUERY = componentData.query;
export const rowActionsConfig: ActionConfigItem[] = [];
let baseColumnJSON: ColumnDefinition[] = [];
let columnsParseError: string | null = null;
const HEADER_BUTTONS_CONFIG: AddButtonConfig[] = (() => {
  const raw = componentData.headerButtons;
  if (!raw) return [];
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed)
        ? parsed.filter((btn) => btn && typeof btn.interaction === "string")
        : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw)
    ? raw.filter((btn) => btn && typeof btn.interaction === "string")
    : [];
})();

const JDBC_ID: number = (() => {
  const raw = (componentData as any)?.jdbcId;
  const n = Number(typeof raw === "string" ? raw.trim() : raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
})();

const { title, subtitle, showBorder, tamanhoModal, closeModalOnReload, tableDesign  } = componentData;
const MODAL_RELOAD_BEHAVIOR = closeModalOnReload === true || closeModalOnReload === "true";
const IMAGE_FORMAT = componentData.imageFormat || "circle";
const TABLE_DESIGN = (tableDesign || "classic").toLowerCase();
const VARIABLE_SEARCH: string = (componentData.variableSearch || "").toString().trim();
const LIVE_SEARCH = true;
const X_AXIS_FK_COLUMN: string = (componentData.xAxisFkColumn || "").toString().trim();
const X_AXIS_LABEL_COLUMN: string = (componentData.xAxisLabelColumn || "").toString().trim();
const X_AXIS_ROW_KEY_COLUMN: string = (componentData.xAxisRowKeyColumn || "").toString().trim();
const X_AXIS_FIXED_COLUMNS: string[] = (() => {
  const raw = componentData.xAxisFixedColumns;
  if (!raw) return [];
  try { return Array.isArray(raw) ? raw : JSON.parse(String(raw)); } catch { return String(raw).split(","); }
})();
const X_AXIS_FIXED_COUNT: number = (() => {
  const raw = componentData.xAxisFixedColumns;
  if (raw == null) return 0;
  const first = Array.isArray(raw) ? String(raw[0] ?? "") : String(raw);
  const n = Number(first.trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
})();

const XAXIS_HEADER_SUBGROUPS: boolean = !!X_AXIS_FK_COLUMN;
const X_AXIS_DETAIL_COLUMNS_RAW: string[] = (() => {
  const raw = (componentData as any).xAxisDetailColumns;
  if (!raw) return [];
  try { return Array.isArray(raw) ? raw : JSON.parse(String(raw)); } catch { return String(raw).split(","); }
})();


const parseTamanhoModal = (() => {
  const raw = componentData.tamanhoModal; 
  if (typeof raw === "string" && /^\d+:\d+$/.test(raw)) {
    const [w, h] = raw.split(":").map(Number);
    return { width: w, height: h };
  }
  return { width: 100, height: 100 }; 
})();

const computeActionsGroupWidthPx = (
  cfg?: ColumnDefinition["buttonsGroupConfig"] | null
): string => {
  const BTN = 28;
  const GAP = 4;
  const CELL_PADDING_X = 16;

  const n = cfg?.buttons?.length ? cfg.buttons.length : 0;
  if (n <= 0) return "64px"; 

  const content = n * BTN + Math.max(0, n - 1) * GAP;
  const total = CELL_PADDING_X + content;

  return `${Math.max(64, total)}px`;
};

let buttonsGroupConfig: ColumnDefinition["buttonsGroupConfig"] | null = null;
try {
  const rawBGC = componentData.buttonsGroupConfig;
  if (rawBGC && String(rawBGC).trim() !== "") {
    let parsed: any;
    if (typeof rawBGC === "string") {
      const s = rawBGC.trim();
      try { parsed = JSON.parse(s); }
      catch { parsed = eval(`(${s})`); }
    } else {
      parsed = rawBGC;
    }
    if (Array.isArray(parsed)) {
      buttonsGroupConfig = {
        setRowIdVariable: componentData.setRowIdVariableBotaoGrupo || "ID",
        buttons: parsed,
      };
    }
  }
} catch {
  console.warn("buttonsGroupConfig inválido (ignorado).");
}

let iconPhotoColumns: ColumnDefinition[] = [];
if (componentData.iconPhotoColumnsConfig) {
  try {
    const parsedIconPhotoConfig =
      typeof componentData.iconPhotoColumnsConfig === "string"
        ? JSON.parse(componentData.iconPhotoColumnsConfig)
        : componentData.iconPhotoColumnsConfig;

    if (Array.isArray(parsedIconPhotoConfig)) {
      iconPhotoColumns = parsedIconPhotoConfig.map(
        (config: Partial<ColumnDefinition>) => {
          return {
            ...config,
            columnType: "data_iconphoto",
            dataField: config.columnName!,
            headerName: config.headerName || config.columnName,
            width: config.width || "60px", 
            cellAlignment: "center",
            headerAlignment: "center",
            enableSorting: false,
            enableHiding: true,
             imageShape: config.imageShape || 'circle',
                __isIconColumn: true, 
position:
        config.position !== undefined && config.position !== ""
          ? Number(config.position)
          : undefined,
          };
        }
      );
    }
  } catch (e) {
    console.error("Erro ao processar a variável iconPhotoColumnsConfig:", e);
    columnsParseError = "A variável 'iconPhotoColumnsConfig' está inválida.";
  }
}


try {
  const rawColumns = componentData.columns;
  const parsedColumns = Array.isArray(rawColumns)
    ? rawColumns
    : (typeof rawColumns === "string" && rawColumns.trim() !== ""
        ? JSON.parse(rawColumns)
        : []);

  if (!Array.isArray(parsedColumns)) {
    throw new Error("A variável 'columns' não é um array válido.");
  }
  if (parsedColumns.length === 0) {
    baseColumnJSON = [];
  } else {
    const hasInvalidColumnName = parsedColumns.some(
      (col) => !col || col.columnName === null || col.columnName === undefined || String(col.columnName).trim() === ""
    );
    if (hasInvalidColumnName) {
      throw new Error("Toda coluna na variável 'columns' precisa ter um 'columnName' válido.");
    }
    const hasMissingColumnType = parsedColumns.some((col) => !col || !col.columnType);
    if (hasMissingColumnType) {
      throw new Error("Toda coluna na variável 'columns' precisa ter um 'columnType'.");
    }

  const contentColumns = [
    ...parsedColumns,
    ...iconPhotoColumns,
  ];

  const indexedColumns = contentColumns.map((c: any, index: number) => ({
    ...c,
    __originalIndex: index,
  }));

  indexedColumns.forEach((col) => {
    col.position =
      col.position !== undefined && col.position !== ""
        ? Number(col.position)
        : undefined;
  });

const positionedColumns: (typeof indexedColumns[0] | null)[] = [];
const nonPositionedColumns: typeof indexedColumns = [];

for (const col of indexedColumns) {
  if (col.position !== undefined) {
    positionedColumns[col.position - 1] = col; 
  } else {
    nonPositionedColumns.push(col);
  }
}

for (let idx = 0; idx < positionedColumns.length + nonPositionedColumns.length; idx++) {
  if (!positionedColumns[idx]) {
    const next = nonPositionedColumns.shift();
    if (next) positionedColumns[idx] = next;
  }
}

positionedColumns.forEach((col) => col && delete (col as any).__originalIndex);

baseColumnJSON = positionedColumns.filter(Boolean) as ColumnDefinition[];
  }

if (buttonsGroupConfig) {
  const actionsColumn: ColumnDefinition = {
    columnName: "Ações",
    dataField: "__actions__",
    columnType: "action_buttons_group",
    headerName: "Ações",
    cellAlignment: "center",
    headerAlignment: "center",
    enableSorting: false,
    enableHiding: false,
    width: computeActionsGroupWidthPx(buttonsGroupConfig),
    buttonsGroupConfig: buttonsGroupConfig,
  };
  baseColumnJSON.push(actionsColumn);
}

} catch (err: any) {
  console.error("Erro ao processar as configurações das colunas:", err);
  columnsParseError =
    err.message || "A variável 'columns' ou 'buttonsGroupConfig' está inválida.";
}

const DEFAULT_HEADER_CLASS = "text-center";
const DEFAULT_CELL_CLASS = "text-left";

const formatNumberBR = (value: any) =>
  typeof value === "number"
    ? new Intl.NumberFormat("pt-BR").format(value)
    : value;

function EllipsisTooltip(props: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const { text, className, style, children } = props;
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  const check = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.clientWidth);
  }, []);

  React.useLayoutEffect(() => {
    check();
  }, [text, check]);

  React.useEffect(() => {
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [check]);

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      title={isTruncated ? text : undefined}
    >
      {children ?? text}
    </div>
  );
}

const parseNumberBR = (str: string) => {
  if (!str) return NaN;
  return parseFloat(str.replace(/\./g, "").replace(",", "."));
};

const toNumberStrict = (v: any) => {
  if (v === null || v === undefined || v === "") return NaN;
  return typeof v === "number" ? v : parseNumberBR(String(v));
};

const roundN = (n: number, places: number) => {
  if (!isFinite(n)) return NaN;
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
};

const formatNumberBRN = (value: any, places: number) => {
  const num = typeof value === "number" ? value : toNumberStrict(value);
  if (!isFinite(num)) return ""; 
  if (places === 0) {
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 0,
      useGrouping: false, 
    }).format(Math.trunc(num));
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(roundN(num, places));
};

const getDecimalPlacesForColumn = (colDef: ColumnDefinition) => {
  const idRegex = /(^id$)|(^id_)|(_id$)/i;
  const looksLikeId =
    idRegex.test(colDef.columnName ?? "") || idRegex.test(colDef.dataField ?? "");
  return looksLikeId ? 0 : 2;
};

const resolveAlertVisual = (
  colDef: ColumnDefinition | any,
  rawValue: any
): { type: "dot" | "bg" | "text"; color: string } | null => {
  const cfg = colDef?.alertConfig;
  if (!cfg || !cfg.type || !Array.isArray(cfg.rules)) return null;

  const valStr = String(rawValue ?? "").trim();
  const valNum = Number(valStr);
  const isNum = !isNaN(valNum) && isFinite(valNum);

  const hit = cfg.rules.find((r) => {
    const rStr = String(r.match).trim();
    if (rStr === valStr) return true;
    const rNum = Number(rStr);
    if (!isNaN(rNum) && isFinite(rNum) && isNum) {
      return rNum === valNum;
    }
    return false;
  });

  if (hit) return { type: cfg.type, color: hit.color };
  if (cfg.elseColor) return { type: cfg.type, color: cfg.elseColor };
  return null;
};

const wrapCellWithAlert = (
  inner: React.ReactNode,
  alert: { type: "dot" | "bg" | "text"; color: string } | null,
  opts?: { invasiveOnInputs?: boolean } 
) => {
  if (!alert) return inner;

if (alert.type === "dot") {
  return (
    <div className="flex items-center gap-0">
      <div className="min-w-0 truncate w-full">{inner}</div>
      <span
        aria-hidden
        className="inline-block rounded-full ml-2"
        style={{ width: 8, height: 7, backgroundColor: alert.color }}
      />
    </div>
  );
}

  const allowInvasive = opts?.invasiveOnInputs ?? false;
  if (!allowInvasive) return inner;

  if (alert.type === "bg") {
    return (
      <div className="w-full h-full -m-[8px] p-[8px]" style={{ backgroundColor: alert.color }}>
        {inner}
      </div>
    );
  }

  if (alert.type === "text") {
    return <div style={{ color: alert.color }}>{inner}</div>;
  }

  return inner;
};


const parseToYYYYMMDD = (dateStr: any, customFormat?: string): string => {
  if (!dateStr) return "";
  const trimmedDateStr = String(dateStr).trim();

  if (customFormat) {
    try {
      const parsedDate = parse(trimmedDateStr, customFormat, new Date());
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, "yyyy-MM-dd");
      } else {
        return "";
      }
    } catch (e) {
      return "";
    }
  }

  try {
    const standardDate = new Date(trimmedDateStr);
    if (!isNaN(standardDate.getTime())) {
      return standardDate.toISOString().split("T")[0];
    }
  } catch {}

  return "";
};

const isDateColumn = (colDef: ColumnDefinition): boolean => {
  if (colDef.columnType === "input_date") return true;
  if (colDef.inputDateFormat) return true;
const nameRegex = /data|date|dt_|_dt|data_|_data|nascimento|vencimento|limite|prazo|entrega|criacao|atualizacao|envio|inicio|fim/i;
  if (nameRegex.test(String(colDef.columnName || colDef.dataField || ""))) {
    return true;
  }
  return false;
};

const parseValueToTimestamp = (v: any, customFormat?: string): number => {
  if (v === null || v === undefined || v === "") return NaN;
  const s = String(v).trim();
  if (customFormat) {
    try {
      const d = parse(s, customFormat, new Date());
      if (!isNaN(d.getTime())) return d.getTime();
    } catch {}
  }
  
  const formats = [
    "dd/MM/yyyy HH:mm:ss",
    "dd/MM/yyyy HH:mm",
    "dd/MM/yyyy",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd"
  ];

  for (const f of formats) {
    try {
      const d = parse(s, f, new Date());
      if (!isNaN(d.getTime())) return d.getTime();
    } catch {}
  }
  
  try {
    const d4 = parse(s, "yyyy-MM-dd", new Date());
    if (!isNaN(d4.getTime())) return d4.getTime();
  } catch {}
  
  const d5 = new Date(s);
  return isNaN(d5.getTime()) ? NaN : d5.getTime();
};

function deriveHeaderClass(col: ColumnDefinition): string {
  if (col.headerAlignment) {
    switch (col.headerAlignment) {
      case "left": return "text-left";
      case "center": return "text-center";
      case "right": return "text-right";
    }
  }

  const idRegex = /(^id$)|(^id_)|(_id$)/i;
  const isIdInName =
    idRegex.test(col.columnName ?? "") || idRegex.test(col.dataField ?? "");

  if (col.columnType === "data_number") {
    return isIdInName ? "text-left" : "text-right";
  }

  switch (col.columnType) {
    case "data_number":
      return "text-right";
    case "data_text":
            case "data_int":
      return "text-left";
    case "input_date":
    case "data_boolean_checkbox":
    case "action_button":
    case "action_buttons_group":
    case "input_text":
    case "input_number":
    case "input_dropdown":
    case "data_iconphoto":
      return "text-center";
    default:
      return "text-left";
  }
}
const VAR_ROW_ID_FOR_CHANGE_DB = componentData.setRowIdForChangeDBAction;
const VAR_ON_CHANGE_VALUE = componentData.onValueChangeMitraVariable;

function generateColumns(
  definitions: ColumnDefinition[],
  dynamicOptionsMap: {
    [key: string]: Array<{ label: string; value: string | number | boolean }>;
  },
  reloadData: (silent?: boolean) => Promise<void>,
  updateCellValue: (
    rowId: number | string,
    field: string,
    newValue: any
  ) => void,
  density: "compacto" | "normal" , 
    resolveKey: (k?: string) => string,
  getCI: (obj: Record<string, any>, k?: string) => any,
  getRowId: (row: Record<string, any>) => string | number | undefined,
  clearXAxisSort: () => void
): ColumnDef<DataRow>[] {
  const isCompact = density === "compacto";
  const INPUT_HEIGHT_CLASS = isCompact ? "h-6" : "h-7";

  return definitions.map((colDef) => {
const effectiveWidth =
  colDef.width && String(colDef.width).trim() !== ""
    ? colDef.width
    : colDef.columnType === "data_iconphoto"
      ? "50px"
      : colDef.columnType === "action_buttons_group"
        ? computeActionsGroupWidthPx(colDef.buttonsGroupConfig)
        : "130px";


const columnDefInternal: Partial<ColumnDef<DataRow>> & {
  accessorKey?: keyof DataRow | string;
  width?: string;
  headerClassName?: string;
} = {
id: colDef.columnName,
 accessorKey: resolveKey(colDef.dataField),
  width: effectiveWidth,
  alertConfig: (colDef as any).alertConfig,
header: ({ column: tableColumn }) => {
  const getSortIconName = (dir: false | "asc" | "desc") => {
   if (dir === "asc") return "ArrowUp";
    if (dir === "desc") return "ArrowDown";
    return "ArrowUpDown";
  };

  const dir = tableColumn.getIsSorted();
const sortIcon = getSortIconName(dir);
  const isSorted = dir === "asc" || dir === "desc";

  const sortIndex =
    typeof tableColumn.getSortIndex === "function"
      ? tableColumn.getSortIndex()
      : undefined;

    window.updateMitra = () => {
      reloadData(true)
     }

const cycleSorting = (e?: React.SyntheticEvent) => {
  e?.stopPropagation();
    clearXAxisSort();
  if (!dir) {
    tableColumn.toggleSorting(false);
  } else if (dir === "asc") {
    tableColumn.toggleSorting(true);
  } else {
    if (typeof tableColumn.clearSorting === "function") {
      tableColumn.clearSorting();
    } else {
      tableColumn.toggleSorting(true);
    }
  }
};

const canSort = tableColumn.getCanSort(); 

const headerContent = (
  <div
    className={cn("inline-flex items-center gap-1 min-w-0 select-none")}
    role={canSort ? "button" : undefined}
   tabIndex={canSort ? 0 : undefined}
    onClick={canSort ? cycleSorting : undefined}
    onKeyDown={
      canSort
        ? (ev) => {
            if (ev.key === "Enter" || ev.key === " ") cycleSorting(ev);
          }
        : undefined
    }
    aria-label={canSort ? "Ordenar coluna" : undefined}
    aria-sort={
      canSort ? (!dir ? "none" : dir === "asc" ? "ascending" : "descending") : undefined
    }
    title={
      canSort
        ? !dir
          ? "Clique para ordenar crescente"
          : dir === "asc"
          ? "Clique para ordenar decrescente"
          : "Clique para remover ordenação"
        : ""
    }
    style={{ cursor: canSort ? "pointer" : "default" }}
  >
    <span className={cn("truncate", isSorted && "underline")}>
      {colDef.headerName || colDef.columnName}
    </span>
    {isSorted && (
      <span className="relative inline-flex items-center">
        <DynamicIcon name={sortIcon} className="h-4 w-4" />
      </span>
    )}
  </div>
);

  let headerAlignmentClass = deriveHeaderClass(colDef);
  if (XAXIS_HEADER_SUBGROUPS && !colDef.headerAlignment) {
    headerAlignmentClass = "text-center";
  }

  const justifyClass = headerAlignmentClass.includes("text-left")
    ? "justify-start"
    : headerAlignmentClass.includes("text-right")
    ? "justify-end"
    : "justify-center";

return (
  <div className={`flex items-center w-full h-full ${justifyClass}`}>
    {headerContent}
  </div>
);

},

      cell: ({ row }) => {
        const currentDataRow = row.original as DataRow;
        const initialValue = getCI(currentDataRow, colDef.dataField);

        const cellClassNameFromDef = (() => {
          if (colDef.cellAlignment) {
            switch (colDef.cellAlignment) {
              case "left": return "text-left";
              case "center": return "text-center";
              case "right": return "text-right";
            }
          }

const idRegex = /(^id$)|(^id_)|(_id$)/i;
          const isIdInName =
            idRegex.test(colDef.columnName ?? "") ||
            idRegex.test(colDef.dataField ?? "");

          if (colDef.columnType === "data_number") {
            return isIdInName ? "text-left" : "text-right";
          }

          switch (colDef.columnType) {
            case "data_number": return "text-right";
            case "data_text": return "text-left";
            case "input_date":
            case "data_boolean_checkbox":
            case "action_button":
            case "action_buttons_group":
            case "input_text":
            case "input_number":
            case "input_dropdown":
                  case "data_iconphoto":
              return "text-center";
            default:
              return "text-left";
          }
        })();
        let isDisabled = false;
        if (colDef.disabledControlColumn) {
          const controlValue = getCI(currentDataRow, colDef.disabledControlColumn);
          if (controlValue === 0) {
            isDisabled = true;
          }
        }

        const handleCellGenericMitraAction = async (
          interaction: string | undefined,
          rowIdVariableToSet: string | undefined,
          formContentIdDataField: keyof DataRow | string | undefined,
          modalW: number | undefined,
          modalH: number | undefined
        ) => {
        if (!interaction) return;
        const [type, idStr] = interaction.split(":");
         const id = Number(idStr);
         
          const rowIdVal = getRowId(currentDataRow);
          if (VAR_ROW_ID_FOR_CHANGE_DB && rowIdVal !== undefined) {
            await setVariableMitra({
              name: VAR_ROW_ID_FOR_CHANGE_DB,
              content: rowIdVal,
            });
          }

          switch (type) {
           case "dbaction":
             await dbactionMitra({ id });
              await reloadData(true);
              updateComponentsMitra({ all: true});
              break;

            case "form":
             await waitIndefinitely(formMitra({ id, contentId: rowIdVal }));
              await reloadData(true);
              updateComponentsMitra({ all: true});
              break;

            case "modal":
safeModalMitra({
  id,
  width: modalW,
  height: modalH,
  floating: false,
  reload: MODAL_RELOAD_BEHAVIOR
});
              break;

            case "action":
              await actionMitra({ id });
              await reloadData(true);
              updateComponentsMitra({ all: true});
              break;
          }
        };

        switch (colDef.columnType) {
       case "data_iconphoto": {
  const photoField = colDef.imageField?.trim() || null;
 const photo = photoField ? getCI(currentDataRow, photoField) : null;

  const iconField = colDef.iconField?.trim() || null;
  const rawIcon = iconField ? getCI(currentDataRow, iconField) : null;
  const icon = rawIcon ? getIconComponent(String(rawIcon)) : null;

  const iconColor = getCI(currentDataRow, colDef.iconColorField || "corIcone") || undefined;

   const bg1 = getCI(currentDataRow, colDef.iconBgColor1Field || "bg1") || "transparent";
   const bg2 = getCI(currentDataRow, colDef.iconBgColor2Field || "bg2");

  const shapeClass =
    colDef.imageShape === "circle"
      ? "rounded-full"
      : colDef.imageShape === "rounded"
      ? "rounded-lg"
      : "rounded-none";

  const [imgError, setImgError] = React.useState(false);

  const BrokenImage = () => (
  <div
    className={`w-7 h-7 flex items-center justify-center ${shapeClass}`}
    style={{ background: "#E5E7EB" }} 
    title="Imagem não disponível"
    aria-label="Imagem não disponível"
  >
    <DynamicIcon 
      name="ImageOff" 
      className="w-4 h-4" 
      style={{ color: "#5D6585" }} 
    />
  </div>
);

  return (
    <div className="flex items-center justify-center w-full">
      {photo && !imgError ? (
        <img
          src={photo}
          alt="avatar"
          className={`w-7 h-7 object-cover border border-[#E7E8F0] ${shapeClass}`}
          onError={() => setImgError(true)} 
          loading="lazy"
        />
      ) : icon ? (
        <div
          className={`w-7 h-7 flex items-center justify-center ${shapeClass}`}
          style={{
            background: bg2 ? `linear-gradient(135deg, ${bg1}, ${bg2})` : bg1,
          }}
        >
          <DynamicIcon
            name={icon}
            className="w-4 h-4"
            style={
              iconColor && /^#|rgb|hsl/.test(String(iconColor))
                ? { color: String(iconColor) }
                : undefined
            }
          />
        </div>
      ) : (
        <BrokenImage />
      )}
    </div>
  );
}
case "data_int": {
  const txt = formatNumberBRN(toNumberStrict(initialValue), 0);
  return (
    <EllipsisTooltip
      text={String(txt ?? "")}
      className={`${cellClassNameFromDef} truncate`}
      style={getConditionalTextStyle(txt, colDef)}
    >
      {txt}
    </EllipsisTooltip>
  );
}

case "data_text":
case "data_number": {
  const places = getDecimalPlacesForColumn(colDef);

  const txt =
    colDef.columnType === "data_number"
      ? formatNumberBRN(toNumberStrict(initialValue), places)
      : String(initialValue ?? "");

  return (
    <EllipsisTooltip
      text={String(txt ?? "")}
      className={`${cellClassNameFromDef} truncate`}
      style={getConditionalTextStyle(txt, colDef)} // ✅ APLICADO AQUI
    >
      {txt}
    </EllipsisTooltip>
  );
}

          case "action_buttons_group":
            if (!colDef.buttonsGroupConfig) return null;

            return (
              <div
                className={`${cellClassNameFromDef} flex gap-1 justify-center`}
              >
                {colDef.buttonsGroupConfig.buttons.map((btn, idx) => {
                  if (btn.queryColumn && getCI(currentDataRow, btn.queryColumn) !== 1)
                    return null;
                  
                  if (!btn.interactionColumn) {
                      console.error(`Botão '${btn.hoverText}' não tem 'interactionColumn' definida.`);
                      return null;
                  }
                  const interaction = getCI(currentDataRow, btn.interactionColumn) as string | undefined;

                  const IconComponent = getIconComponent(btn.icon);
                  const hasCustomColor = !!btn.bgColor;

                  return (
                    <Button
                      key={idx}
                      title={btn.hoverText}
                      disabled={!interaction} 
                      onClick={() => {
                          if (interaction) {
                              handleCellGenericMitraAction(
                                  interaction,
                                  colDef.buttonsGroupConfig?.setRowIdVariable,
                                  undefined,
                                  undefined,
                                  undefined
                              );
                          }
                      }}
                      variant="ghost"
                      className={`w-7 h-7 p-0 aspect-square rounded-md flex items-center justify-center transition ${
                        hasCustomColor
                          ? "text-white hover:opacity-90"
                          : "bg-white text-slate-700 border border-slate-300 hover:!bg-slate-100"
                      }`}
                      style={{
                        ...(hasCustomColor && { backgroundColor: btn.bgColor }),
                        ...(btn.iconColor && { color: btn.iconColor }),
                      }}
                    >
                      {IconComponent ? (
                        <DynamicIcon name={IconComponent} className="w-5 h-5" />
                      ) : (
                        <span className="text-xs">?</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            );

          case "data_boolean_checkbox":
            const isChecked = getCI(currentDataRow, colDef.dataField);
            const checked = isChecked === true || isChecked === 1 || isChecked === "1" || isChecked === "true";
            return (
              <div className={`${cellClassNameFromDef}`}>
                <Checkbox
                  checked={checked}
                  disabled={isDisabled}
                  onCheckedChange={async (checkedState) => {
                    const newValue = checkedState === true ? 1 : 0;

                    const rowIdVal = getRowId(currentDataRow);
                    if (VAR_ROW_ID_FOR_CHANGE_DB && rowIdVal !== undefined) {
                      await setVariableMitra({
                        name: VAR_ROW_ID_FOR_CHANGE_DB,
                        content: rowIdVal,
                      });
                    }

                    const variableName = colDef.onValueChangeMitraVariable || VAR_ON_CHANGE_VALUE;
if (variableName) {
  await setVariableMitra({
    name: variableName,
    content: newValue,
  });
}

                    if (colDef.onValueChangeDBActionID !== undefined) {
                      await dbactionMitra({
                        id: colDef.onValueChangeDBActionID,
                      });

                      updateCellValue(rowIdVal as any, resolveKey(colDef.dataField), newValue);
                      await reloadData(true);
                      updateComponentsMitra({ all: true});
                    }
                  }}
                />
              </div>
            );

          case "action_button":
            if (!colDef.interactionColumn) {
                console.error(`Coluna '${colDef.columnName}' não tem 'interactionColumn' definida.`);
                return <div className="text-red-500 text-xs">Erro de Config.</div>;
            }
            const interaction = getCI(currentDataRow, colDef.interactionColumn) as string | undefined;

            return (
                <div className={cellClassNameFromDef}>
                    <Button
                        variant={colDef.buttonVariant === "destructive" ? "destructive" : "outline"}
                        size="sm"
                        disabled={!interaction}
                        onClick={() => {
                            if (interaction) {
                                handleCellGenericMitraAction(
                                    interaction,
                                    colDef.setRowIdVariableForButton,
                                    getRowId(currentDataRow) as any,
                                    colDef.mitraModalWidthForButton || parseTamanhoModal.width,
                                    colDef.mitraModalHeightForButton || parseTamanhoModal.height
                                );
                            }
                        }}
                    >
                        {colDef.buttonText || "Ação"}
                    </Button>
                </div>
            );

         case "input_text":
case "input_number": {
  const places = getDecimalPlacesForColumn(colDef);

  return (
    <div className={`${cellClassNameFromDef}`}>
      <Input
        key={`${row.id}-${initialValue}`}

        type="text"
        defaultValue={
          colDef.columnType === "input_number"
            ? formatNumberBRN(toNumberStrict(initialValue), places) 
            : String(initialValue ?? "")
        }
        disabled={isDisabled}
        onBlur={async (e) => {
          const raw = e.target.value;
          let finalNewValue: any;

          if (colDef.columnType === "input_number") {
            const parsed = parseNumberBR(raw);
            finalNewValue = isNaN(parsed) ? null : roundN(parsed, places); 
          } else {
            finalNewValue = raw;
          }

          if (String(initialValue ?? "") === String(finalNewValue)) return;

          let needsReload = false;

          const rowIdVal = getRowId(currentDataRow);
          if (VAR_ROW_ID_FOR_CHANGE_DB && rowIdVal !== undefined) {
            await setVariableMitra({ name: VAR_ROW_ID_FOR_CHANGE_DB, content: rowIdVal });
          }

          const variableNameForInput = colDef.onValueChangeMitraVariable || VAR_ON_CHANGE_VALUE;
          if (variableNameForInput) {
            await setVariableMitra({ name: variableNameForInput, content: finalNewValue });
            needsReload = true;
          }

          if (colDef.onValueChangeDBActionID !== undefined) {
            await dbactionMitra({ id: colDef.onValueChangeDBActionID });
            needsReload = true;
            updateComponentsMitra({ all: true });
          }

          if (needsReload) {
            updateCellValue(rowIdVal as any, resolveKey(colDef.dataField), finalNewValue);
            await reloadData(true);
            updateComponentsMitra({ all: true });
          }
        }}
        className={`text-sm truncate ${INPUT_HEIGHT_CLASS} w-full max-w-full`}
        style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      />
    </div>
  );
}


          case "input_date":
            const formattedDate = parseToYYYYMMDD(initialValue, colDef.inputDateFormat);
            const debounceRef = React.useRef<NodeJS.Timeout | null>(null); 

            return (
              <div className={`${cellClassNameFromDef} relative`}>
                <Input
                  key={`${getRowId(row.original)}-${formattedDate}`}
                  type="date"
                  defaultValue={formattedDate}
                  disabled={isDisabled}
                  onChange={(e) => {
                    const finalNewValue = e.target.value;

                    if (debounceRef.current) clearTimeout(debounceRef.current);

                    debounceRef.current = setTimeout(async () => {
                      if (finalNewValue === formattedDate) return;
 
                    let needsReload = false;
 
                    const rowIdVal = getRowId(currentDataRow);
                    if (VAR_ROW_ID_FOR_CHANGE_DB && rowIdVal !== undefined) {
                      await setVariableMitra({
                        name: VAR_ROW_ID_FOR_CHANGE_DB,
                        content: rowIdVal,
                      });
                   }
 
                  const variableNameForDate = colDef.onValueChangeMitraVariable || VAR_ON_CHANGE_VALUE;
if (variableNameForDate) {
  await setVariableMitra({
    name: variableNameForDate,
    content: finalNewValue,
  });
  needsReload = true;
}
 
                    if (colDef.onValueChangeDBActionID !== undefined) {
                      await dbactionMitra({ id: colDef.onValueChangeDBActionID });
                      needsReload = true;
                      updateComponentsMitra({ all: true});
                    }
 
                    if (needsReload) {
                      updateCellValue(
                         rowIdVal as any,
                        resolveKey(colDef.dataField),
                        finalNewValue
                      );
                      await reloadData(true);
                    }
                     }, 800);
                  }}
                  className={`text-sm truncate ${INPUT_HEIGHT_CLASS} w-full max-w-full `}
                  style={{
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                />
              </div>
            );
            case "input_dropdown":
            const fieldKey = resolveKey(colDef.dataField);
            const effectiveOptions =
              (dynamicOptionsMap[fieldKey] ??
               dynamicOptionsMap[String(colDef.dataField)] ??
               (colDef.dropdownOptions || []));

            return (
              <div className={`w-full flex justify-center`} >
                <Select
                  disabled={isDisabled}
                  value={String(initialValue ?? "")}
                  onValueChange={async (selectedValue) => {
                if (String(initialValue ?? "") === selectedValue) return;
 
                let needsReload = false;
 
               const rowIdVal = getRowId(currentDataRow);
                if (VAR_ROW_ID_FOR_CHANGE_DB && rowIdVal !== undefined) {
                  await setVariableMitra({
                    name: VAR_ROW_ID_FOR_CHANGE_DB,
                    content: rowIdVal,
                  });
                }
 
               const variableNameForSelect = colDef.onValueChangeMitraVariable || VAR_ON_CHANGE_VALUE;
if (variableNameForSelect) {
  await setVariableMitra({
    name: variableNameForSelect,
    content: selectedValue,
  });
  needsReload = true; 
}
               
                if (colDef.onValueChangeDBActionID !== undefined) {
                  await dbactionMitra({ id: colDef.onValueChangeDBActionID });
                  needsReload = true; 
                  updateComponentsMitra({ all: true});
                }
 
                if (needsReload) {
                  updateCellValue(
                    rowIdVal as any,
                    resolveKey(colDef.dataField),
                    selectedValue
                  );
                  await reloadData(true);
                  updateComponentsMitra({ all: true});
                }
              }}
                >
                  <SelectTrigger
                    className={`w-full max-w-full truncate ${INPUT_HEIGHT_CLASS} px-2`}
                    style={{
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <SelectValue
                      className="w-full truncate text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                      placeholder={
                        colDef.dropdownOptionsWithQuery && effectiveOptions.length === 0
                          ? "Carregando opções..."
                          : colDef.headerName || colDef.columnName || "Selecione..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveOptions.map((opt) => (
                      <SelectItem
                        key={opt.value.toString()}
                        value={opt.value.toString()}
                        className="truncate"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );

default: {
  const txt = String(initialValue ?? "");
  return (
    <EllipsisTooltip
      text={txt}
      className={`${cellClassNameFromDef} truncate`}
      style={getConditionalTextStyle(txt, colDef)} // ✅ APLICADO AQUI
    >
      {txt}
    </EllipsisTooltip>
  );
}

        }
      },
  enableSorting: colDef.enableSorting
    ? colDef.enableSorting
    : (!!colDef.dataField && !colDef.columnType.startsWith("action_")),
  enableHiding:
    colDef.enableHiding !== undefined ? colDef.enableHiding : true,
};

(columnDefInternal as any).sortUndefined = "last";

columnDefInternal.headerClassName = deriveHeaderClass(colDef);
columnDefInternal.cellClassName = (() => {
  if (colDef.cellAlignment) return `text-${colDef.cellAlignment}`;
  return deriveHeaderClass(colDef);
})();

if (colDef.columnType === "data_number" || colDef.columnType === "input_number" || colDef.columnType === "data_int") {
  (columnDefInternal as any).sortingFn = (rowA: any, rowB: any, columnId: string) => {
    const rawA = rowA.getValue(columnId);
        const rawB = rowB.getValue(columnId);

        const toNumber = (v: any) => {
          if (v === null || v === undefined || v === "") return NaN;
          return typeof v === "number" ? v : parseNumberBR(String(v));
        };

        const a = toNumber(rawA);
        const b = toNumber(rawB);

        if (isNaN(a) && isNaN(b)) return 0;
if (isNaN(a)) return 1;
        if (isNaN(b)) return -1;

        return a - b;
      };
   }
    else if (
      colDef.columnType === "input_date" ||
      !!colDef.inputDateFormat ||
      isDateColumn(colDef) 
    ) {
      (columnDefInternal as any).sortingFn = (rowA: any, rowB: any, columnId: string) => {
        const rawA = rowA.getValue(columnId);
        const rawB = rowB.getValue(columnId);

        const a = parseValueToTimestamp(rawA, colDef.inputDateFormat);
        const b = parseValueToTimestamp(rawB, colDef.inputDateFormat);

        if (isNaN(a) && isNaN(b)) return 0;
        if (isNaN(a)) return 1;
        if (isNaN(b)) return -1;

        return a === b ? 0 : a > b ? 1 : -1;
      };
    }

(columnDefInternal as any).columnType  = colDef.columnType;
(columnDefInternal as any).alertConfig = colDef.alertConfig;

return columnDefInternal as ColumnDef<DataRow>;
  });
}

const parsePx = (v?: string) => {
  if (!v) return NaN;
  const m = String(v).match(/(\d+(?:\.\d+)?)px/);
  return m ? Number(m[1]) : NaN;
};

const normalizeWidth = (w?: string | number): string => {
  if (typeof w === "number" && w > 0) return `${w}px`;
  if (typeof w === "string" && w.trim() !== "") return w;
  return "130px";
};
const getFixedKeysForPivot = (
  table: any,
  resolveKey: (k?: string) => string
): string[] => {
  const leaf = table.getVisibleLeafColumns?.() ?? [];
  const asArray = (val: any): any[] => Array.isArray(val) ? val : [val];

  let raw = X_AXIS_FIXED_COLUMNS as any;

  if (typeof raw === "string") {
    const s = raw.trim();
    if (/^\[.*\]$/.test(s)) {
      try { raw = JSON.parse(s); } catch {}
    }
  }

  const tryNum = Number(raw);
  if (Number.isFinite(tryNum) && tryNum > 0) {
    const n = Math.min(leaf.length, Math.floor(tryNum));
    return leaf.slice(0, n).map((c: any) => (c.columnDef as any).accessorKey);
  }

  if (Array.isArray(raw)) {
    if (raw.every((x: any) => Number.isFinite(Number(x)))) {
      const idxs = raw.map((x: any) => Math.max(1, Math.floor(Number(x))));
      return idxs
        .map(i => leaf[i - 1])
        .filter(Boolean)
        .map((c: any) => (c.columnDef as any).accessorKey);
    }

    const wanted = raw
      .map((x: any) => resolveKey(String(x)))
      .map((rk: string) => rk && rk.toLowerCase())
      .filter(Boolean);

    return leaf
      .map((c: any) => (c.columnDef as any).accessorKey)
      .filter((k: string) => wanted.includes(String(k).toLowerCase()));
  }

  return [];
};

const buildStickyMeta = (
  table: any,
  fixedIndicesOneBased: number[]
): {
  metaById: Record<string, { leftPx: number; zIndex: number }>;
  orderedFixedIds: string[];
} => {
  const leaf = table.getVisibleLeafColumns?.() ?? [];
  const fixedSet = new Set(fixedIndicesOneBased.filter(n => Number.isFinite(n) && n > 0));
  const metaById: Record<string, { leftPx: number; zIndex: number }> = {};
  const orderedFixedIds: string[] = [];

  let left = 0;
  let visualIndex = 0;
  for (const col of leaf) {
    visualIndex += 1;
    const def: any = col.columnDef || {};
    const w = parsePx(def.width) || parsePx(def.minWidth) || 130; 

    if (fixedSet.has(visualIndex)) {
      metaById[col.id] = { leftPx: left, zIndex: 20 }; 
      orderedFixedIds.push(col.id);
      left += w;
    }
  }

  return { metaById, orderedFixedIds };
};

const buildStickyMetaByKeys = (
  table: any,
  fixedAccessorKeys: string[]
): {
  metaByAccessor: Record<string, { leftPx: number; zIndex: number }>;
  orderedFixedKeys: string[];
} => {
  const leaf = table.getVisibleLeafColumns?.() ?? [];
  const wanted = new Set(fixedAccessorKeys.map(k => String(k || '').toLowerCase()));
  const metaByAccessor: Record<string, { leftPx: number; zIndex: number }> = {};
  const orderedFixedKeys: string[] = [];

  let left = 0;
  for (const col of leaf) {
    const def: any = col.columnDef || {};
    const acc: string = def.accessorKey || def.id || '';
    if (!acc) continue;

    if (wanted.has(String(acc).toLowerCase())) {
      const w =
        parsePx(def.width) || parsePx(def.minWidth) || 130; 

      metaByAccessor[acc] = { leftPx: left, zIndex: 20 };
      orderedFixedKeys.push(acc);
      left += w;
    }
  }
  return { metaByAccessor, orderedFixedKeys };
};

// --- Componente principal -----------------------------------
export function DataTableDemo() {
  const paginacaoAtiva = componentData.paginacaoAtiva === true || componentData.paginacaoAtiva === "true";
  const [tableData, setTableData] = React.useState<DataRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const TABLE_DENSITY = "normal";
  const enableSearch = componentData.enableSearch === true || componentData.enableSearch === "true";
 const ENABLE_EXPORT_BUTTON = componentData.enableExportButton === true || componentData.enableExportButton === "true";

 const HIGHLIGHT_VAR = String((componentData as any)?.highlight ?? "").trim();
 const highlightEnabled = !!HIGHLIGHT_VAR;

 React.useEffect(() => {
   (async () => {
     if (!HIGHLIGHT_VAR) return;
     try {
       await setVariableMitra({ name: HIGHLIGHT_VAR, content: "" });
     } catch (e) {
       console.warn("Falha ao limpar variável de highlight no mount:", e);
     }
   })();
 }, [HIGHLIGHT_VAR]);

 const [selectedIds, setSelectedIds] = React.useState<any[]>([]);
 const lastHighlightClickRef = React.useRef<{ id: any; t: number }>({ id: null, t: 0 });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const setSortingSingle = React.useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      setSorting((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        if (!Array.isArray(next)) return [];
        if (next.length <= 1) return next;
        return [next[next.length - 1]];
      });
    },
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState(enableSearch ? "" : undefined);

const [columnVisibility, setColumnVisibility] =
  React.useState<VisibilityState>({});

const [rowSelection, setRowSelection] = React.useState({});

const [queryBasedTotals, setQueryBasedTotals] =
  React.useState<Record<string, any>>({});


 const [xAxisGroupSort, setXAxisGroupSort] = React.useState<{
    groupKey: any;
    dir: "asc" | "desc";
    detailKey?: string;
  } | null>(null);

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 7,
  });


  const [dynamicOptionsMap, setDynamicOptionsMap] = React.useState<{
    [key: string]: Array<{ label: string; value: string | number | boolean }>;
  }>({});

      const [resolvedHeaderButtons, setResolvedHeaderButtons] = React.useState<any[]>([]);

  const [headerLUT, setHeaderLUT] = React.useState<Record<string, string>>({});
  const headerLUTRef = React.useRef(headerLUT);
  React.useEffect(() => {
    headerLUTRef.current = headerLUT;
  }, [headerLUT]);

const [firstHeaderName, setFirstHeaderName] = React.useState<string | null>(null);

  const resolveKey = React.useCallback((k?: string) => {
    if (!k || typeof k !== "string") return "";
    return headerLUT[k.toLowerCase()] ?? k;
  }, [headerLUT]);

  const resolveKeyRef = React.useCallback((k?: string) => {
    if (!k || typeof k !== "string") return "";
    const lut = headerLUTRef.current || {};
    return lut[k.toLowerCase()] ?? k;
  }, []);

  const getCI = React.useCallback((obj: Record<string, any>, k?: string) => {
    const actual = resolveKey(k);
    return actual ? obj?.[actual] : undefined;
  }, [resolveKey]);


  const ROW_ID_FIELD = React.useMemo(() => {
    if (Object.prototype.hasOwnProperty.call(headerLUT, "id")) {
      return headerLUT["id"];
    }
    if (firstHeaderName && firstHeaderName.trim() !== "") {
      return firstHeaderName;
    }
    return "ID";
  }, [headerLUT, firstHeaderName]);
  const getRowIdValue = React.useCallback(
    (row: Record<string, any>) => row?.[ROW_ID_FIELD],
    [ROW_ID_FIELD]
  );

  const getColDefByDataField = React.useCallback((dataField: string) => {
    const key = resolveKey(dataField);
    return baseColumnJSON.find(c => resolveKey(c.dataField) === key);
  }, [baseColumnJSON, resolveKey]);

const computeDetailKeys = React.useCallback((
  fkKeyResolved: string,
  labelKeyResolved: string,
  fixedKeysResolved: string[]
) => {
  const allDefs = baseColumnJSON.filter(d => !!d?.dataField);
  const fixedSet = new Set(fixedKeysResolved.map(k => k.toLowerCase()));
  const skipSet = new Set([fkKeyResolved, labelKeyResolved].filter(Boolean).map(k => k.toLowerCase()));

  const isActionCol = (d: ColumnDefinition) => d.columnType === "action_buttons_group";

  const derived = allDefs
    .filter(d => !isActionCol(d))
    .map(d => resolveKey(d.dataField))
    .filter(k => !!k)
    .filter(k => !fixedSet.has(k.toLowerCase()))
    .filter(k => !skipSet.has(k.toLowerCase()));

  if (X_AXIS_DETAIL_COLUMNS_RAW.length > 0) {
    const wanted = X_AXIS_DETAIL_COLUMNS_RAW.map(resolveKey).filter(Boolean);
    return wanted;
  }
  return derived;
}, [baseColumnJSON, resolveKey]);


  const updateCellValue = React.useCallback(
    (rowId: number | string, field: string, newValue: any) => {
      setTableData((prev) =>
        prev.map((r) =>
          String(getRowIdValue(r)) === String(rowId) ? { ...r, [field]: newValue } : r
        )
      );
    },
    [getRowIdValue]
  );

const transformMitraData = (res: {
  headers: { name: string }[];
  data: any[][];
}): DataRow[] => {
  const booleanColumns = baseColumnJSON
    .filter((col) => col.columnType === "data_boolean_checkbox")
    .map((col) => col.dataField);

  const normalizeEmptyToUndefined = (v: any) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
  };

  return res.data.map((row) =>
    res.headers.reduce((obj, h, idx) => {
      const value = row[idx];
      const isBooleanField = booleanColumns.includes(h.name);

      (obj as any)[h.name] = isBooleanField
        ? value === true || value === 1 || value === "1" || value === "true"
        : normalizeEmptyToUndefined(value); 

      return obj;
    }, {} as any)
  ) as DataRow[];
};


const isSingleCellResult = (res: { headers?: { name: string }[]; data?: any[][] }) => {
  const rows = Array.isArray(res?.data) ? res.data : [];
  const cols = Array.isArray(res?.headers) ? res.headers : [];
  const hasOneRow = rows.length === 1;
  const hasOneCol = cols.length === 1 || (hasOneRow && Array.isArray(rows[0]) && rows[0].length === 1);
  return hasOneRow && hasOneCol;
};

const pickSingleCell = (res: { data?: any[][] }) => {
  if (!Array.isArray(res?.data) || res.data.length === 0) return null;
  const firstRow = res.data[0] ?? [];
  return Array.isArray(firstRow) && firstRow.length > 0 ? firstRow[0] : null;
};

const fetchTotalizerData = React.useCallback(async () => {
  const totalizerQueries = baseColumnJSON.filter(
    (c) => typeof c.enableTotalizer === "string" && c.enableTotalizer.trim() !== ""
  );
  if (totalizerQueries.length === 0) {
    setQueryBasedTotals({});
    return;
  }

  const promises = totalizerQueries.map(async (colDef) => {
    const key = resolveKeyRef(colDef.dataField);
    try {
      const result = await queryMitra({ query: colDef.enableTotalizer!, jdbcId: JDBC_ID });

      if (!isSingleCellResult(result)) {
        return { key, value: null, status: "skipped" as const };
      }

      const totalValue = pickSingleCell(result);
      return { key, value: totalValue, status: "fulfilled" as const };
    } catch (error) {
      return { key, value: null, status: "rejected" as const };
    }
  });

  const results = await Promise.all(promises);

  const newTotals = results.reduce((acc, r) => {
    if (r.status === "fulfilled" && r.key) acc[r.key] = r.value;
    return acc;
  }, {} as Record<string, any>);

  setQueryBasedTotals(newTotals);
}, [baseColumnJSON, resolveKeyRef]);

  const fetchData = React.useCallback(
    async (
      silent: boolean = false,
      syncSearchVar: boolean = false,
      searchValue?: string
    ) => {
      if (!silent) setLoading(true);
      try {
        if (syncSearchVar && VARIABLE_SEARCH) {
          await setVariableMitra({
            name: VARIABLE_SEARCH,
            content: enableSearch ? (searchValue ?? "") : ""
          });
        }
        const res = await queryMitra({ query: TAREFA_SQL_QUERY, jdbcId: JDBC_ID });
    
        const lut: Record<string, string> = {};
        for (const h of res.headers || []) {
          const nm = String(h?.name ?? "");
          if (nm) lut[nm.toLowerCase()] = nm;
        }
        setHeaderLUT((prev) => {
          const prevKeys = Object.keys(prev);
          const newKeys = Object.keys(lut);
          const sameLen = prevKeys.length === newKeys.length;
          const same = sameLen && newKeys.every((k) => prev[k] === lut[k]);
          return same ? prev : lut;
        });
    setFirstHeaderName(res.headers && res.headers[0]?.name ? String(res.headers[0].name) : null);

setTableData(transformMitraData(res));
        await fetchTotalizerData(); 
    
      } catch (e: any) {
        setError("A variável query está inválida");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [enableSearch, VARIABLE_SEARCH, TAREFA_SQL_QUERY, fetchTotalizerData] 
  );

  const fetchDropdownOptions = React.useCallback(async () => {
    const map: {
      [key: string]: Array<{ label: string; value: string | number | boolean }>;
    } = {};
    const dcols = baseColumnJSON.filter(
      (c) => c.columnType === "input_dropdown" && c.dropdownOptionsWithQuery
    );
    await Promise.all(
      dcols.map(async (col) => {
        try {
          const res = await queryMitra({
            query: col.dropdownOptionsWithQuery!,
            jdbcId: JDBC_ID,
          });
          map[resolveKeyRef(String(col.dataField))] = res.data.map((r) => ({
            value: r[0],
            label: r[1] !== undefined ? r[1] : r[0],
          }));
        } catch (err) {
          console.error(`Erro options (${col.columnName})`, err);
        }
      })
    );
    setDynamicOptionsMap(map);
  }, [JDBC_ID]);


const fetchHeaderButtons = React.useCallback(async () => {
    const headerButtonsTemplate = (() => {
      try {
        const raw = componentData.headerButtons;
        return typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
      } catch (e) {
        console.error("Erro ao processar a variável 'headerButtons':", e);
        return [];
      }
    })();

    const query = componentData.headerButtonsQuery;

    if (!query) {
      const legacyButtons = headerButtonsTemplate.filter(btn => btn.interaction);
      if (legacyButtons.length > 0) {
        setResolvedHeaderButtons(legacyButtons);
      }
      return;
    }
    
    if (!headerButtonsTemplate || headerButtonsTemplate.length === 0) {
        setResolvedHeaderButtons([]);
        return;
    }

    try {
      const res = await queryMitra({ query, jdbcId: JDBC_ID });
      if (res.data.length === 0) {
        setResolvedHeaderButtons([]);
        return;
      }

      const interactionData = res.headers.reduce((obj, header, idx) => {
        obj[header.name] = res.data[0][idx];
        return obj;
      }, {} as Record<string, string>);

      const finalButtons = headerButtonsTemplate.map(btnTemplate => {
        const interaction = interactionData[btnTemplate.interactionColumn];
        if (!interaction) {
          return null; 
        }
        return {
          ...btnTemplate,
          interaction: interaction, 
        };
      }).filter(Boolean); 

      setResolvedHeaderButtons(finalButtons);

    } catch (e) {
      setError("Erro ao carregar ações do cabeçalho.");
      setResolvedHeaderButtons([]);
    }
  }, []);

React.useEffect(() => {
  let cancelled = false;

  (async () => {
    if (enableSearch && VARIABLE_SEARCH) {
      try {
        await setVariableMitra({ name: VARIABLE_SEARCH, content: "" });
      } catch (e) {
        console.warn("Falha ao inicializar variável de busca:", e);
      }
    }

    if (cancelled) return;

    if (enableSearch) setGlobalFilter("");

    fetchData(false, false, ""); 
    fetchDropdownOptions();
    fetchHeaderButtons();
    fetchTotalizerData();
  })();

  return () => {
    cancelled = true;
  };
}, [
  enableSearch,
  VARIABLE_SEARCH,
  fetchData,
  fetchDropdownOptions,
  fetchHeaderButtons,
  fetchTotalizerData,
]);


  const localSilentReload = React.useCallback(() => fetchData(true), [fetchData]);

  React.useEffect(() => {
    silentReload = localSilentReload;
  }, [localSilentReload]);

  const finalColumnJSON = baseColumnJSON;

 const columns = React.useMemo(
     () =>
       generateColumns(
         finalColumnJSON,
         dynamicOptionsMap,
         silentReload,
         updateCellValue,
         TABLE_DENSITY,
         resolveKey,
         getCI,
         getRowIdValue,
         () => setXAxisGroupSort(null)        
       ),
    [
      finalColumnJSON,
      dynamicOptionsMap,
      silentReload,
      updateCellValue,
      TABLE_DENSITY,
      resolveKey,
      getCI,
      getRowIdValue,
      xAxisGroupSort
    ]
  );

  const tableOptions: any = {
    data: tableData,
    columns,
    autoResetPageIndex: false,
   onSortingChange: setSortingSingle,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: enableSearch ? setGlobalFilter : undefined,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
      ...(enableSearch && { globalFilter }),
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
     enableSortingRemoval: true,
    enableMultiSort: false,
    maxMultiSortColCount: 1,
globalFilterFn: (row, _colId, filterValue) => {
  const term = String(filterValue ?? "").trim().toLowerCase();
  if (!term) return true;

  const hasLetters = /[a-zA-ZÀ-ÿ]/.test(term);
  const isIdField = (field: string) =>
    /^id$/i.test(field) || /(^id_|_id$)/i.test(field);

  return Object.entries(row.original).some(([field, value]) => {
    if (hasLetters && isIdField(field)) return false;

    if (String(value ?? "").toLowerCase().includes(term)) return true;

    const opts =
      dynamicOptionsMap[resolveKeyRef(field)] ??
      dynamicOptionsMap[field];

    if (opts) {
      const opt = opts.find((o) => String(o.value) === String(value));
      if (opt && String(opt.label).toLowerCase().includes(term)) return true;
    }

    return false;
  });
},

    getRowId: (row: any, index: number) => {
  const businessId = getRowIdValue(row as any);
  if (businessId === undefined || businessId === null || businessId === "") {
    return `row-${index}`;
  }
  return `row-${ROW_ID_FIELD}-${String(businessId)}-${index}`;
},

  };

  if (paginacaoAtiva) {
    const linhasPorPagina = Number(componentData.linhasPorPagina) || 7;
    tableOptions.onPaginationChange = setPagination;
    tableOptions.state.pagination = {
      ...pagination,
      pageSize: linhasPorPagina
    };
    tableOptions.getPaginationRowModel = getPaginationRowModel();
  }

  const table = useReactTable(tableOptions);

const fixedIndicesOneBased = React.useMemo(() => {
  if (XAXIS_HEADER_SUBGROUPS) return []; 
  return Array.from({ length: Math.max(0, X_AXIS_FIXED_COUNT) }, (_, i) => i + 1);
}, [XAXIS_HEADER_SUBGROUPS, X_AXIS_FIXED_COUNT]);


const stickyMeta = React.useMemo(() => {
  if (!fixedIndicesOneBased.length) return { metaById: {}, orderedFixedIds: [] as string[] };
  return buildStickyMeta(table, fixedIndicesOneBased);
}, [table, fixedIndicesOneBased]);




const typingSyncRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const liveReloadRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const lastSentSearchRef = React.useRef<string>("");

const rafIdRef = React.useRef<number | null>(null);
const runIdRef = React.useRef(0); 

const handleSearchChange = React.useCallback(
  async (val: string) => {
    setGlobalFilter?.(val);
    const normalizedSearch = val.trim().toUpperCase();
    if (VARIABLE_SEARCH) {
      try {
        await setVariableMitra({ name: VARIABLE_SEARCH, content: normalizedSearch });
      } catch (e) {
        console.warn("Falha ao setar variável de busca:", e);
      }
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    if (liveReloadRef.current) {
      clearTimeout(liveReloadRef.current);
    }

    table?.setPageIndex?.(0);

    if (normalizedSearch === "") {
      lastSentSearchRef.current = "";
      await fetchData(true, true, "");
      return;
    }

    if (normalizedSearch.length < 1) {
      return; 
    }

    if (LIVE_SEARCH) {
      const thisRun = ++runIdRef.current;
      
      rafIdRef.current = requestAnimationFrame(async () => {
        if (thisRun === runIdRef.current && normalizedSearch !== lastSentSearchRef.current) {
          await fetchData(true, true, normalizedSearch);
          lastSentSearchRef.current = normalizedSearch;
        }
      });
    }
  },
  [setGlobalFilter, VARIABLE_SEARCH, LIVE_SEARCH, fetchData, table]
);
React.useEffect(() => {
  return () => {
    if (typingSyncRef.current) clearTimeout(typingSyncRef.current);
    if (liveReloadRef.current) clearTimeout(liveReloadRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
  };
}, []);


const isInitialMount = React.useRef(true);
const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const searchInputRef = React.useRef<HTMLInputElement>(null);

const submitSearch = React.useCallback(
  async (termOverride?: string) => {
    const raw = termOverride !== undefined ? termOverride : (globalFilter || "");
    const normalized = raw.trim().toUpperCase();

    if (normalized === lastSentSearchRef.current) return;

    await fetchData(true, true, normalized);
    lastSentSearchRef.current = normalized;
  },
  [globalFilter, fetchData]
);

const handleExportXLSX = React.useCallback(() => {
  const XLSX = (window as any).XLSX;

  if (!XLSX) {
    alert('Falha ao exportar XLSX: A biblioteca (XLSX) não foi carregada.');
    return;
  }

  try {
    if (!table) throw new Error('Tabela não inicializada');

    let aoa: any[][] = [];
    let merges: any[] = []; 

    if (XAXIS_HEADER_SUBGROUPS && X_AXIS_FK_COLUMN && X_AXIS_ROW_KEY_COLUMN) {
      
      const fkKey = resolveKey(X_AXIS_FK_COLUMN);
      const rowKey = resolveKey(X_AXIS_ROW_KEY_COLUMN);
      const labelKey = X_AXIS_LABEL_COLUMN ? resolveKey(X_AXIS_LABEL_COLUMN) : fkKey;

      const allLeaf = table.getAllLeafColumns();
      const fixedFromConfig = getFixedKeysForPivot(table, resolveKey);
      const isVisible = (k: string) => !!allLeaf.find((c) => (c.columnDef as any).accessorKey === k && c.getIsVisible?.());
      const fixedVisibleKeys = fixedFromConfig.filter(isVisible);
      const fixedKeys = fixedVisibleKeys.length > 0 ? fixedVisibleKeys : fixedFromConfig;
      const detailKeys = computeDetailKeys(fkKey, labelKey, fixedKeys);

      const visibleRows = table.getRowModel().rows || [];
      const groupMap = new Map<string, { key: any; label: any }>();
      const groupOrder: any[] = [];
      const seenGroups = new Set<string>();

      for (const r of visibleRows) {
        const gv = (r.original as any)[fkKey];
        const label = (r.original as any)[labelKey] ?? gv;
        const kStr = String(gv ?? "");
        if (!seenGroups.has(kStr)) {
          seenGroups.add(kStr);
          groupOrder.push(gv);
          groupMap.set(kStr, { key: gv, label });
        }
      }

      const headerRowTop: string[] = [];    
      const headerRowBottom: string[] = []; 
      let currentColumnIndex = 0;

      fixedKeys.forEach(k => {
        const def = getColDefByDataField(k);
        headerRowTop.push("");
        headerRowBottom.push(def?.headerName || def?.columnName || k);
        currentColumnIndex++;
      });

      groupOrder.forEach(gVal => {
        const gLabel = groupMap.get(String(gVal ?? ""))?.label ?? gVal;
        const groupStartCol = currentColumnIndex;

        headerRowTop.push(String(gLabel));
        
        for (let i = 1; i < detailKeys.length; i++) {
            headerRowTop.push("");
        }

        detailKeys.forEach(dk => {
          const def = getColDefByDataField(dk);
          headerRowBottom.push(def?.headerName || def?.columnName || dk);
        });

        const groupEndCol = currentColumnIndex + detailKeys.length - 1;

        if (detailKeys.length > 0) {
            merges.push({
                s: { r: 0, c: groupStartCol }, 
                e: { r: 0, c: groupEndCol }    
            });
        }
        currentColumnIndex += detailKeys.length;
      });

      aoa.push(headerRowTop);
      aoa.push(headerRowBottom);

      const pivot = new Map<string, { fixedRow: any; byGroup: Map<any, any> }>();
      for (const r of visibleRows) {
        const rkVal = (r.original as any)[rowKey];
        const fkVal = (r.original as any)[fkKey];
        const keyStr = String(rkVal ?? "");
        if (!pivot.has(keyStr)) {
          pivot.set(keyStr, { fixedRow: r.original, byGroup: new Map() });
        }
        const slot = pivot.get(keyStr)!;
        if (!slot.fixedRow) slot.fixedRow = r.original;
        slot.byGroup.set(fkVal, r.original);
      }

      Array.from(pivot.values()).forEach(pack => {
        const rowData: any[] = [];
        fixedKeys.forEach(k => {
          const def = getColDefByDataField(k);
          const colId = def ? resolveKey(def.dataField) : k;
          let val = (pack.fixedRow as any)?.[colId];
          if (val === null || val === undefined) val = "";
          rowData.push(val);
        });
        groupOrder.forEach(gVal => {
          const rowForGroup = pack.byGroup.get(gVal) || {};
          detailKeys.forEach(dk => {
            const def = getColDefByDataField(dk);
            const colId = def ? resolveKey(def.dataField) : dk;
            let val = (rowForGroup as any)?.[colId];
            if (val === null || val === undefined) val = "";
            rowData.push(val);
          });
        });
        aoa.push(rowData);
      });
    } 
else {
  const visibleLeafColumns = table.getVisibleLeafColumns();

  const colHeaders = visibleLeafColumns.map((col) => {
    const def: any = col.columnDef;
    const accessorKey = def?.accessorKey; 

    const baseDef = baseColumnJSON.find((c: any) => {
      const k = resolveKey(c.dataField);
      return k === accessorKey || c.dataField === accessorKey;
    });

    return (
      baseDef?.headerName ||      
      def?.headerName ||          
      def?.columnName ||          
      col.id                      
    );
  });

  const colAccessors = visibleLeafColumns.map(col => (col.columnDef as any).accessorKey);
  aoa.push(colHeaders);

  const dataRows = table.getRowModel().rows;
  dataRows.forEach(tableRow => {
    const rowData = tableRow.original;
    const aoaRow = colAccessors.map(key => {
      let val = (rowData as any)[key];
      if (val === null || val === undefined) val = "";
      return val;
    });
    aoa.push(aoaRow);
  });
}


    const ws = XLSX.utils.aoa_to_sheet(aoa);

    if (merges.length > 0) {
        ws['!merges'] = merges;
    }

    const widths = [];
    const countCols = aoa[0] ? aoa[0].length : 0;
    const baseRowForWidth = (merges.length > 0 && aoa.length > 1) ? 1 : 0;

    for (let c = 0; c < countCols; c++) {
      let maxLen = 0;
      const scanRows = Math.min(aoa.length, 50); 
      for (let hr = 0; hr < scanRows; hr++) {
        const cell = (aoa[hr] && aoa[hr][c]) ? String(aoa[hr][c]) : '';
        maxLen = Math.max(maxLen, cell.length);
      }
      widths.push({ wch: Math.max(12, Math.min(maxLen + 2, 60)) });
    }
    ws['!cols'] = widths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    const fileName = (window.componentData && (componentData.exportFileName || componentData.fileName)) || 'relatorio.xlsx';
    XLSX.writeFile(wb, fileName);
  } catch (err: any) {
    alert('Falha ao exportar XLSX.');
  }
}, [table, baseColumnJSON, resolveKey, getColDefByDataField, computeDetailKeys]);
  React.useEffect(() => {
   if (!isInitialMount.current) {
      if (table && paginacaoAtiva) {
        table.setPageIndex(0);
      }
    } else {
      isInitialMount.current = false;
    }
  }, [globalFilter]); 


const showSetupPlaceholder = !TAREFA_SQL_QUERY || baseColumnJSON.length === 0;
if (showSetupPlaceholder) {
  return (
    <div className="p-6">
      <Card className="border-solid">
        <CardHeader>
          <CardTitle>Componente não configurado</CardTitle>
          <CardDescription>
            Defina sua <code>query</code> (SQL válido) e suas <code>variáveis</code> de configuração para carregar a tabela.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
  if (error)
    return <div className="p-4 text-center text-red-600"> Erro: {error} </div>;
const DESIGN_CLASS = TABLE_DESIGN === "data" ? "design-data" : "design-classic";

  return (
<div
  className={
    `form-wrapper flex flex-col w-full ${DESIGN_CLASS} ` +
    (TABLE_DESIGN === "data"
      ? "border border-gray-200 shadow-sm rounded-lg bg-white"
      : (showBorder === "false" ? "" : "border shadow-none"))
  }
      style={{
        maxWidth: `100%`,
        margin: '0 auto',
        borderRadius: showBorder === 'false' ? '0px' : '16px',
        borderColor: showBorder === 'false' ? 'transparent' : '#D0D5DD',
        backgroundColor: 'white',
        overflow: 'hidden', 
        height: '100%', 
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .form-wrapper, .form-wrapper * {
          font-family: 'Inter', sans-serif;
        }
        .search-input::placeholder {
          color: var(--cor-texto-secundario);
          font-size: 14px;
        }

.data-table-header {
  background-color: #fbfcff;
  border-radius: 8px 8px 0 0;
  position: sticky; 
  top: 0;
}

.design-data .data-table-header::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: #e5e7eb;
  pointer-events: none;
  z-index: 60; 
}


.design-data .data-table-header-row th.data-table-head-cell {
  background-color: #fbfcff;
  cursor: default;
  transition: background-color 120ms ease-out;
}

.design-data .data-table-header-row th.data-table-head-cell:hover {
  background-color: #F4F4F5 !important;
}

.design-data .data-table-header-row th.sticky-col-header,
.design-data .data-table-header-row th.sticky-col-header:hover {
  background-color: #F4F4F5 !important;
}

  .data-row:hover {
   background-color: #FAFAFA !important;
 }
 .classic-row:hover {
   background-color: #FAFAFA !important;
 }

.data-row { --row-bg: #fff; background-color: var(--row-bg); }
.classic-row { --row-bg: #fff; background-color: var(--row-bg); }

.data-row:hover { --row-bg: #FAFAFA !important; }
.classic-row:hover { --row-bg: #FAFAFA !important; }

.data-row:hover > td,
.classic-row:hover > td {
  background-color: var(--row-bg, #fff) !important;
}





.no-hover,
.no-hover:hover,
.no-hover > th,
.no-hover > th:hover {
  background-color: inherit !important;
  cursor: default !important;
}

.no-hover th,
thead .no-hover th:hover {
  background-color: inherit !important;
}
 .data-table-head-cell {
   font-weight: 600;
   color: #374151;
 }
.data-table-container {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow-x: auto; 
  overflow-y: hidden;
}
.table-header-cell {
  padding: 8px !important;
}

 .data-table-container table {
   min-width: max-content;      
 }
 .data-table-container thead,
 .data-table-container tbody tr {
   min-width: max-content;
   width: max-content;
 }

.data-table-row,
.data-table-cell {
  border: none !important;
}

.data-table-head-cell {
  height: 36px !important;
  min-height: 28px !important;
  line-height: 1.4 !important;
  font-weight: 400 !important;
  padding: 8px !important;
  font-size: 12px; 
  color: grey;      
}



.classic-header::after { 
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e7eb;
}

.group-header-row {
  background: #F3F4F6; 
}
.subheader-top {
  background: #F4F4F5;
  box-shadow: none !important; 
  border: none !important;     
}

.subheader-top > th {
  box-shadow: inset 0 -1px 0 #e5e7eb; 
background-color: #F4F4F5 !important;
position: relative; 
  z-index: 20;
}

.subheader-top:hover,
.subheader-top > th:hover {
  background-color: #F4F4F5 !important;
  cursor: default !important;
}

.subheader-bottom {
  background: #FAFAFA;
  position: relative;
  z-index: 30;
}

.subheader-bottom:hover,
.subheader-bottom > th:hover {
  background-color: #FAFAFA !important;
  cursor: default !important;
}

.design-data .subheader-bottom {
  background: #FAFAFA;
}

.design-data .subheader-bottom th {
  border-bottom: none !important;
}

.group-header-cell {
  padding: 10px 12px !important;
  font-weight: 600;
  color: #111827;
  border-top: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
}
.group-title {
  font-size: 13px;
  line-height: 1.2;
}
.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #A3AED0;
}

.subcols-grid {
  display: grid;
  grid-auto-rows: min-content;
  gap: 12px;                 
  padding: 8px 8px 12px;     
}
.subcols-col {
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #FFFFFF;
  overflow: hidden;
}
.subcols-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-weight: 600;
  color: #111827;
 background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}
.subcols-body {
  overflow-x: auto;
}
.subcols-table {
  width: 100%;
  table-layout: fixed;
}
.subcols-cell {
  padding: 8px;
}

:root {
.design-classic {
  --totalizer-bg: #FFFFFF;      
  --totalizer-font-size: 13px;
  --totalizer-font-weight: 600;
  --totalizer-border-color: #E5E7EB;
  --totalizer-label-color: #09090b;
  --totalizer-value-color: #09090b;
}

.design-data {
  --totalizer-bg: #F4F4F5;      
  --totalizer-font-size: 13px;
  --totalizer-font-weight: 600;
  --totalizer-border-color: #E5E7EB;
  --totalizer-label-color: #09090b;
  --totalizer-value-color: #09090b;
}

.totalizer-row {
  height: 38px;                    
}

.totalizer-cell {
  font-size: var(--totalizer-font-size);
  font-weight: var(--totalizer-font-weight);
  background: var(--totalizer-bg);  
}

.totalizer-row .totalizer-cell:first-child {
  color: var(--totalizer-label-color);
}

.totalizer-row .totalizer-cell.text-right,
.totalizer-row .totalizer-cell.text-left,
.totalizer-row .totalizer-cell.text-center {
  color: var(--totalizer-value-color);
}

.classic-header ~ tbody ~ tfoot.totalizer .totalizer-cell {
  background: var(--totalizer-bg, #FFFFFF);
}

.design-data   { --th-divider: #E5E7EB; }  
.design-classic{ --th-divider: #E5E7EB; }  

.vdiv-row > th { position: relative; }

.vdiv-row > th:not(:last-child):not(.sticky-right-shadow)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--th-divider, #E5E7EB);
  pointer-events: none;
  z-index: 1;
}


.design-data   { --th-divider: #E5E7EB; }
.design-classic{ --th-divider: #E5E7EB; }

.subheader-top th {
  color: #727277 !important;
    font-size: 12px !important;
  font-weight: 600 !important;
text-transform: uppercase;
}
.subheader-top th:hover:not([role="button"]) {
  background-color: inherit !important;
  cursor: default !important;
}

.data-table-header tr:hover,
.data-table-header tr:hover > th,
.data-table-header th:hover,
.data-table-header th:hover:not([role="button"]),
.classic-header tr:hover,
.classic-header tr:hover > th,
.classic-header th:hover,
.classic-header th:hover:not([role="button"]),
.subheader-top:hover,
.subheader-top > th:hover,
.subheader-bottom:hover,
.subheader-bottom > th:hover {
  background-color: inherit !important;
  cursor: default !important;
}

.sticky-col-header,
.sticky-col-header:hover {
  background-color: inherit !important;
  cursor: default !important;
}

.data-table-header .sticky-col-header {
  background-color: #F4F4F5 !important;
}

.data-table-header .sticky-col-header:hover {
  background-color: #F4F4F5 !important;
}

.classic-header .sticky-col-header {
  background-color: #FFFFFF !important;
}

.classic-header .sticky-col-header:hover {
  background-color: #FFFFFF !important;
}

th[role="button"],
.data-table-head-cell[role="button"],
thead th[role="button"],
thead .data-table-head-cell[role="button"] {
  cursor: pointer !important;
}

th[role="button"]:hover,
.data-table-head-cell[role="button"]:hover {
  background-color: inherit !important;
  cursor: pointer !important;
}


.data-table-header tr:hover > th,
.classic-header tr:hover > th {
  background-color: inherit !important;
}
.design-data thead tr:not(.subheader-top):first-of-type + tr {
  background: #FAFAFA;
}

.sticky-col {
  position: sticky;
  background-color: var(--row-bg, #fff);
  background: none;
  z-index: 10 !important;
}

.sticky-col *,
.sticky-col > * {
  background-color: inherit !important;
  background: none !important;
}

.data-row > td,
.classic-row > td {
  background-color: inherit;
}

.sticky-col-header {
  position: sticky;
  background: #FFFFFF;
  z-index: 41 !important;
}

thead .sticky-right-shadow {
  position: sticky; 
  right: 0;
  box-shadow: 2px 0 3px rgba(0,0,0,.06) !important; 
}
.classic-header .subheader-top > th.sticky-right-shadow {
  box-shadow: 2px 0 3px rgba(0,0,0,06), inset 0 -1px 0 #e5e7eb !important;
}


thead .sticky-right-shadow::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;            
  width: 1px;
  background: #e5e7eb; 
  pointer-events: none;
  z-index: 100;        
}


        .pagination-button:disabled {
            color: var(--cor-texto-botao-desabilitado);
        }
        .content-with-padding {
            padding: 24px; 
        }
        .table-container-scroll {
            border-bottom-left-radius: ${showBorder === 'false' ? '0px' : '16px'};
            border-bottom-right-radius: ${showBorder === 'false' ? '0px' : '16px'};
            overflow: hidden; 
        }
        .sticky-footer {
          border-bottom-left-radius: ${showBorder === 'false' ? '0px' : '16px'};
          border-bottom-right-radius: ${showBorder === 'false' ? '0px' : '16px'};
        }
      `}


      
      
      </style>

      <div className={cn("flex-1 flex flex-col min-h-0", showBorder !== 'false' && "content-with-padding")}>
        {(title || subtitle) && (
          <div className="space-y-1 flex-shrink-0" style={{ marginBottom: '24px' }}>
            <h2 className="text-lg font-semibold" style={{ color: '#1B2139' }}>{title}</h2> 
            <p className="text-sm" style={{ color: '#5D6585' }}>{subtitle}</p> 
          </div>
        )}

{(enableSearch || resolvedHeaderButtons.length > 0) && (
 <div
    className={cn(
      "flex items-center space-x-2 sticky top-0 z-30 bg-white",
      enableSearch ? "justify-between" : "justify-start"
    )}
    style={{ paddingBottom: '16px', paddingTop: '0' }}
  >
    {enableSearch && (
      <div className="flex-grow">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <DynamicIcon
              name="Search"
              className="h-5 w-5"
              style={{ color: '#5D6585' }}
            />
          </span>
<Input
  ref={searchInputRef}
  placeholder="Buscar..."
  value={globalFilter ?? ""}
  onChange={(e) => {
    const v = (e.target as HTMLInputElement).value;
    handleSearchChange(v);
  }}
  onKeyDown={async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await submitSearch();
    }
  }}
  onBlur={async () => {
    await submitSearch();
  }}
  className="h-9 w-full pl-10 search-input"
  style={{
    borderColor: globalFilter && globalFilter.length < 2 ? '#FF6B6B' : '#E7E8F0',
    color: '#5D6585',
  }}
/>
        </div>
      </div>
    )}

   {(resolvedHeaderButtons.length > 0 || ENABLE_EXPORT_BUTTON) && ( 
     <div className={cn("flex gap-2", enableSearch ? "ml-auto" : "ml-0")}>
       
       {ENABLE_EXPORT_BUTTON && (
         <Button
           id="btn-exportar"
           title="Exportar XLSX"
           onClick={handleExportXLSX}
           size="sm"
           variant="ghost"
           className="h-9 px-3 py-0 inline-flex items-center gap-2 rounded-md transition
                       bg-white text-slate-700 border border-slate-300 hover:!bg-slate-100"
         >
           <DynamicIcon name="FileDown" className="w-[18px] h-[18px] shrink-0" />
           <span className="text-sm font-normal leading-none">Exportar XLSX</span>
         </Button>
       )}
        {resolvedHeaderButtons.map((btn, idx) => ( 
          <Button
            key={idx}
            size="sm"
            variant="ghost"
            className={cn(
              "transition",
              !btn.bgColor && "bg-white text-slate-700 border border-slate-300 hover:!bg-slate-100"
            )}
            style={{
              backgroundColor: btn.bgColor || undefined,
              color: btn.textColor || undefined,
              border: btn.bgColor ? "none" : undefined
            }}
            onClick={async () => {
              if (!btn.interaction) return; 
              const [type, idStr] = btn.interaction.split(":");
              const id = Number(idStr);
              try {
                switch (type) {
                  case "form":
                    await waitIndefinitely(formMitra({ id }));
                    silentReload?.();
                    updateComponentsMitra({ all: true});
                    break;
                  case "modal":
                    modalMitra({
                      id,
                      width: parseTamanhoModal.width,
                      height: parseTamanhoModal.height,
                      floating: false,
                      reload: MODAL_RELOAD_BEHAVIOR,
                    });
                    updateComponentsMitra({ all: true});
                    break;
                  case "dbaction":
                    await dbactionMitra({ id });
                    silentReload?.();
                    updateComponentsMitra({ all: true});
                    break;
                  case "action":
                    await actionMitra({ id });
                    silentReload?.();
                    break;
                }
              } catch (err) {
                console.error("Erro no botão do cabeçalho:", err);
              }
            }}
          >
            {btn.icon && (
              <span className={btn.label ? "mr-2" : ""}>
                <DynamicIcon name={getIconComponent(btn.icon)} className="inherit-color" />
              </span>
            )}
            {btn.label}
          </Button>
        ))}
      </div>
    )}
      </div>
)}


<div className="flex-1 min-h-0">
<div
  className={cn(
    "h-full overflow-auto stable-scrollbar relative",
    TABLE_DESIGN !== "data" && "border-t border-gray-200",
    TABLE_DESIGN === "data" && "border border-gray-200 rounded-xl"
  )}
>
{loading && (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
    <div className="flex flex-col items-center gap-2">
      <DynamicIcon
        name="Loader2"
        className="h-8 w-8 animate-spin"
        style={{ color: "#5d6585" }} 
      />
      <p
        className="text-sm font-normal"
        style={{ color: "#5d6585" }} 
      >
        Carregando dados...
      </p>
    </div>
  </div>
)}


{!loading && (
  <Table style={{ tableLayout: "fixed", width: "100%" }}>
  {XAXIS_HEADER_SUBGROUPS && X_AXIS_FK_COLUMN && X_AXIS_ROW_KEY_COLUMN && (() => {
    const fkKey = resolveKey(X_AXIS_FK_COLUMN);
    const labelKey = X_AXIS_LABEL_COLUMN ? resolveKey(X_AXIS_LABEL_COLUMN) : fkKey;

const fixedKeys = getFixedKeysForPivot(table, resolveKey);
const allLeaf = table.getAllLeafColumns();
const isVisible = (k: string) =>
  !!allLeaf.find(c => (c.columnDef as any).accessorKey === k && c.getIsVisible?.());
const fixedVisibleKeys = fixedKeys.filter(isVisible);


    const detailKeys = computeDetailKeys(fkKey, labelKey, fixedKeys);

    const visibleRows = table.getRowModel().rows || [];
    const groupMap = new Map<string, { key: any; label: any }>();
    for (const r of visibleRows) {
      const gv = (r.original as any)[fkKey];
      const label = (r.original as any)[labelKey] ?? gv;
      const k = String(gv ?? "");
      if (!groupMap.has(k)) groupMap.set(k, { key: gv, label });
    }
    const groups = Array.from(groupMap.values());

    const wOf = (dataFieldKey: string) => {
      const def = getColDefByDataField(dataFieldKey);
      return normalizeWidth(def?.width);
    };

    return (
      <colgroup>
        {fixedVisibleKeys.length > 0 && fixedVisibleKeys.map((k) => (
          <col key={`col-fx-${k}`} style={{ width: wOf(k) }} />
        ))}
        {fixedKeys.length > 0 && fixedVisibleKeys.length === 0 && fixedKeys.map((k) => (
          <col key={`col-fx-${k}`} style={{ width: wOf(k) }} />
        ))}

        {groups.map((g, gi) =>
          detailKeys.map((dk) => (
            <col key={`col-g${gi}-${dk}`} style={{ width: wOf(dk) }} />
          ))
        )}
      </colgroup>
    );
  })()}
          {!XAXIS_HEADER_SUBGROUPS || !X_AXIS_FK_COLUMN || !X_AXIS_ROW_KEY_COLUMN ? (
            <TableHeader
              className={cn(
                TABLE_DESIGN === "data" ? "sticky top-0 z-20 data-table-header" : "sticky top-0 z-20 bg-white classic-header"
              )}
            >
{table.getHeaderGroups().map((headerGroup) => (
  <TableRow
    key={headerGroup.id}
    className={cn(
      TABLE_DESIGN === "data" ? "border-b data-table-header-row no-hover" : "no-hover",
      XAXIS_HEADER_SUBGROUPS && "vdiv-row"
    )}
  >
{headerGroup.headers.map((header, idx) => {
      const def = header.column.columnDef as any;

      const sticky = stickyMeta.metaById[header.column.id];
      const isFixed = !!sticky;
      const isLastFixed =
        isFixed && stickyMeta.orderedFixedIds[stickyMeta.orderedFixedIds.length - 1] === header.column.id;

      const stickyBgColor = TABLE_DESIGN === "data"
        ? "#fbfcff" 
        : "#FFFFFF"; 

      return (
        <TableHead
          key={header.id}
          className={cn(
            "data-table-head-cell p-[8px] font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 align-middle",
            isFixed && "sticky-col-header",
            isLastFixed && "sticky-right-shadow"
          )}
          style={{
            width: def.width,
            minWidth: def.width,
            maxWidth: def.width,
            ...(isFixed ? { 
              left: `${sticky.leftPx}px`, 
              zIndex: sticky.zIndex, 
              background: TABLE_DESIGN === "data" ? "#F4F4F5" : "#FFFFFF"
            } : {})
          }}
        >
          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
        </TableHead>
      );
    })}
  </TableRow>
))}

            </TableHeader>
          ) : (
            <TableHeader className={cn(TABLE_DESIGN === "data" ? "sticky top-0 z-20 data-table-header" : "sticky top-0 z-20 bg-white classic-header")}>
              {(() => {
                const fkKey = resolveKey(X_AXIS_FK_COLUMN);
                const labelKey = X_AXIS_LABEL_COLUMN ? resolveKey(X_AXIS_LABEL_COLUMN) : fkKey;

                const allLeaf = table.getAllLeafColumns();
                const fixedFromConfig = getFixedKeysForPivot(table, resolveKey);
                const isVisible = (k: string) => !!allLeaf.find((c) => (c.columnDef as any).accessorKey === k && c.getIsVisible?.());
                const fixedVisibleKeys = fixedFromConfig.filter(isVisible);
                const fixedKeys = fixedVisibleKeys.length > 0 ? fixedVisibleKeys : fixedFromConfig;

                const detailKeys = computeDetailKeys(fkKey, labelKey, fixedKeys);
                
                const visibleRows = table.getRowModel().rows || [];
                const groupMap = new Map<string, { key: any; label: any }>();
                for (const r of visibleRows) {
                  const gv = (r.original as any)[fkKey];
                  const label = (r.original as any)[labelKey] ?? gv;
                  const k = String(gv ?? "");
                  if (!groupMap.has(k)) groupMap.set(k, { key: gv, label });
                }
                const groups = Array.from(groupMap.values());

                const fixedKeysEff = (fixedVisibleKeys.length > 0 ? fixedVisibleKeys : fixedKeys);
                const stickyPivot = buildStickyMetaByKeys(table, fixedKeysEff);
                const lastFixedKey = stickyPivot.orderedFixedKeys[stickyPivot.orderedFixedKeys.length - 1];

                if (detailKeys.length === 1) {
                    const detailKey = detailKeys[0];
                    const detailDef = getColDefByDataField(detailKey);
                    
                    return (
                        <TableRow className={cn("no-hover subheader-top", XAXIS_HEADER_SUBGROUPS && "vdiv-row")}>
                            {fixedKeysEff.map((k) => {
                                const def = getColDefByDataField(k);
                                const label = def?.headerName || def?.columnName || k;
                                
                                const stickyInfo = stickyPivot.metaByAccessor[k];
                                const isFixed = !!stickyInfo;
                                const isLastFixed = isFixed && k === lastFixedKey;

                                const headerObj = table.getHeaderGroups().flatMap(hg => hg.headers).find(h => (h.column.columnDef as any).accessorKey === k);

                                return (
                                    <TableHead
                                        key={`fx-single-${k}`}
                                        className={cn(
                                            "data-table-head-cell",
                                            isFixed && "sticky-col-header",
                                            isLastFixed && "sticky-right-shadow"
                                        )}
                                        style={{
                                            width: def?.width,
                                            minWidth: def?.width,
                                            maxWidth: def?.width,
                                            ...(isFixed ? { 
                                                position: "sticky",
                                                left: `${stickyInfo.leftPx}px`, 
                                                zIndex: stickyInfo.zIndex,
                                                background: TABLE_DESIGN === "data" ? "#F4F4F5" : "#FFFFFF"
                                            } : {})
                                        }}
                                    >
                                        {headerObj
                                            ? flexRender(headerObj.column.columnDef.header, headerObj.getContext())
                                            : <span>{label}</span>
                                        }
                                    </TableHead>
                                );
                            })}

{groups.map((g, i) => {
    const mustCenter = XAXIS_HEADER_SUBGROUPS && !detailDef?.headerAlignment;
    const isActive = !!(xAxisGroupSort && String(xAxisGroupSort.groupKey) === String(g.key));
    const nextState: "asc" | "desc" | null = !isActive ? "asc" : (xAxisGroupSort!.dir === "asc" ? "desc" : null);

    return (
        <TableHead
            key={`g-single-${i}`}
            role="button" 
            tabIndex={0} 
            className={cn("data-table-head-cell font-semibold", mustCenter && "text-center")}
            style={{
                width: detailDef?.width,
                minWidth: detailDef?.width,
                maxWidth: detailDef?.width,
                ...(mustCenter ? { textAlign: "center" } : {}),
                cursor: "pointer",
                background: TABLE_DESIGN === "data" ? "#F4F4F5" : "#FFFFFF" 
            }}
            onClick={() => {
                setSorting([]);
                if (nextState === null) setXAxisGroupSort(null);
                else setXAxisGroupSort({ groupKey: g.key, dir: nextState, detailKey });
            }}
            onKeyDown={(e) => { 
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSorting([]);
                    if (nextState === null) setXAxisGroupSort(null);
                    else setXAxisGroupSort({ groupKey: g.key, dir: nextState, detailKey });
                }
            }}
        >
            <span className="inline-flex items-center gap-1">
                {String(g.label ?? g.key ?? "")}
                {isActive && (
                    <DynamicIcon
                        name={xAxisGroupSort!.dir === "asc" ? "ArrowUp" : "ArrowDown"}
                        className="h-4 w-4"
                    />
                )}
            </span>
        </TableHead>
    );
})}
                        </TableRow>
                    );
                }

                return (
                    <>
                        <TableRow className={cn("no-hover subheader-top", XAXIS_HEADER_SUBGROUPS && "vdiv-row")}>
                            {fixedKeysEff.length > 0 && (
                                <TableHead
                                    className="data-table-head-cell font-medium sticky-col-header"
                                    colSpan={fixedKeysEff.length}
                                    style={{ 
                                        textAlign: "left", 
                                        position: "sticky", 
                                        left: 0, 
                                        zIndex: 21,
                                        background: "#F4F4F5" 
                                    }}
                                >
                                </TableHead>
                            )}
                            {groups.map((g, i) => (
                                <TableHead
                                    key={`g-top-${i}`}
                                    className="data-table-head-cell font-semibold text-center"
                                    colSpan={detailKeys.length}
                                    style={{ textAlign: "center", cursor: "default" }}
                                >
                                    {String(g.label ?? g.key ?? "")}
                                </TableHead>
                            ))}
                        </TableRow>

                        <TableRow className={cn("no-hover subheader-bottom", XAXIS_HEADER_SUBGROUPS && "vdiv-row")}>
                            {fixedKeysEff.map((k) => {
                                const def = getColDefByDataField(k);
                                const label = def?.headerName || def?.columnName || k;
                                const stickyInfo = stickyPivot.metaByAccessor[k];
                                const isFixed = !!stickyInfo;
                                const isLastFixed = isFixed && k === lastFixedKey;

                                const headerObj = table.getHeaderGroups().flatMap(hg => hg.headers).find(h => (h.column.columnDef as any).accessorKey === k);

                                return (
                                    <TableHead
                                        key={`fx-bottom-${k}`}
                                        className={cn(
                                            "data-table-head-cell",
                                            isFixed && "sticky-col-header",
                                            isLastFixed && "sticky-right-shadow"
                                        )}
                                        style={{
                                            width: def?.width,
                                            minWidth: def?.width,
                                            maxWidth: def?.width,
                                            ...(isFixed ? { 
                                                position: "sticky",
                                                left: `${stickyInfo.leftPx}px`, 
                                                zIndex: stickyInfo.zIndex,
                                                background: TABLE_DESIGN === "data" ? "#FAFAFA" : "#FFFFFF"
                                            } : {})
                                        }}
                                    >
                                         {headerObj
                                            ? flexRender(headerObj.column.columnDef.header, headerObj.getContext())
                                            : <span>{label}</span>
                                        }
                                    </TableHead>
                                );
                            })}

{groups.map((g, gi) =>
    detailKeys.map((dk) => {
        const def = getColDefByDataField(dk);
        const mustCenter = XAXIS_HEADER_SUBGROUPS && !def?.headerAlignment;
        const isActive = !!(xAxisGroupSort && String(xAxisGroupSort.groupKey) === String(g.key) && xAxisGroupSort.detailKey === dk);
        const nextState = !isActive ? "asc" : (xAxisGroupSort!.dir === "asc" ? "desc" : null);

        return (
            <TableHead
                key={`g-${gi}-d-${dk}`}
                role="button" 
                tabIndex={0} 
                className={cn("data-table-head-cell", mustCenter && "text-center")}
                style={{
                    width: def?.width,
                    minWidth: def?.width,
                    maxWidth: def?.width,
                    ...(mustCenter ? { textAlign: "center" } : {}),
                    cursor: "pointer"
                }}
                onClick={() => {
                    setSorting([]);
                    if (nextState === null) setXAxisGroupSort(null);
                    else setXAxisGroupSort({ groupKey: g.key, dir: nextState as "asc" | "desc", detailKey: dk });
                }}
                onKeyDown={(e) => { 
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSorting([]);
                        if (nextState === null) setXAxisGroupSort(null);
                        else setXAxisGroupSort({ groupKey: g.key, dir: nextState as "asc" | "desc", detailKey: dk });
                    }
                }}
            >
                                            <span className="inline-flex items-center gap-1">
                                                {def?.headerName || def?.columnName || dk}
                                                {isActive && (
                                                    <DynamicIcon name={xAxisGroupSort!.dir === "asc" ? "ArrowUp" : "ArrowDown"} className="h-4 w-4" />
                                                )}
                                            </span>
                                        </TableHead>
                                    );
                                })
                            )}
                        </TableRow>
                    </>
                );
              })()}
            </TableHeader>
          )}
            <TableBody className={loading ? "h-96" : ""}>
              {(() => {

                const visibleRows = table.getRowModel().rows || [];
                if (visibleRows.length === 0) {
                  return (
                    <TableRow>
                     <TableCell colSpan={columns.length} className="h-24 text-center">Nenhum resultado encontrado.</TableCell>
                    </TableRow>
                  );
              }

               if (!XAXIS_HEADER_SUBGROUPS || !X_AXIS_FK_COLUMN || !X_AXIS_ROW_KEY_COLUMN) {
                 return visibleRows.map((row) => {
                    const rowId = getRowIdValue(row.original);
                    const isFiltered = highlightEnabled && selectedIds.length > 0;
                    const isActive = isFiltered && rowId !== undefined && selectedIds.includes(rowId);

                  const rowStyle: React.CSSProperties = {
                       minWidth: "max-content",
                       cursor: highlightEnabled ? "pointer" : "default",
                       opacity: isFiltered ? (isActive ? 1 : 0.35) : 1,
                       transition: "opacity 150ms ease-in-out",
                   };

                   const handleRowClick = (event: any) => {
                       if (!highlightEnabled) return;
                       const clickedId = getRowIdValue(row.original);
                       if (clickedId === undefined) return;
                       const now = Date.now();
                       const last = lastHighlightClickRef.current;
                       if (last.id === clickedId && (now - last.t) < 180) return;
                       lastHighlightClickRef.current = { id: clickedId, t: now };

                       const multi = !!event?.ctrlKey || !!event?.metaKey;
                       let next = multi
                           ? (selectedIds.includes(clickedId) ? selectedIds.filter(id => id !== clickedId) : [...selectedIds, clickedId])
                           : (selectedIds.length === 1 && selectedIds[0] === clickedId ? [] : [clickedId]);
                       
                       setSelectedIds(next);
                       (async () => {
                           try {
                               if (HIGHLIGHT_VAR) await setVariableMitra({ name: HIGHLIGHT_VAR, content: next.join(",") || "" });
                               if ((window as any).updateComponentsMitra) (window as any).updateComponentsMitra({ all: true });
                           } catch (e) { console.error(e); }
                       })();
                   };

                   return (
                     <TableRow
                       key={row.id}
                       data-state={row.getIsSelected() && "selected"}
                       className={TABLE_DESIGN === "data" ? "data-row" : "classic-row"}
                       style={rowStyle}     
                       onClick={handleRowClick} 
                     >
   {row.getVisibleCells().map((cell) => {
     const colDef = cell.column.columnDef as any;
      const cellValue = cell.getValue();
      const alert = resolveAlertVisual(colDef, cellValue);

const typeSafeToPaint =
  colDef?.columnType === "data_text" ||
  colDef?.columnType === "data_number" ||
  colDef?.columnType === "data_int" || 
  colDef?.columnType === "data_iconphoto";

      const isBg = !!alert && alert.type === "bg" && !!typeSafeToPaint;

      const inner = flexRender(cell.column.columnDef.cell, cell.getContext());
      const wrapped = isBg
        ? inner
        : wrapCellWithAlert(inner, alert, { invasiveOnInputs: !!typeSafeToPaint });

      const sticky = stickyMeta.metaById[cell.column.id];
      const isFixed = !!sticky;
      const isLastFixed =
        isFixed && stickyMeta.orderedFixedIds[stickyMeta.orderedFixedIds.length - 1] === cell.column.id;

      return (
        <TableCell
          key={cell.id}
          className={cn(isBg ? "align-middle p-0" : "p-2 align-middle", isFixed && "sticky-col", isLastFixed && "sticky-right-shadow")}
style={{
  width: colDef.width,
  minWidth: colDef.width,
  maxWidth: colDef.width,
  ...(isBg ? { backgroundColor: alert!.color } : { backgroundColor: "var(--row-bg, #fff)" }),
  ...(isFixed ? { left: `${sticky.leftPx}px`, zIndex: 10 } : {})
}}

        >
          {wrapped}
        </TableCell>
      );
    })}
  </TableRow>
                 ); 
               }); 

                }

                const fkKey = resolveKey(X_AXIS_FK_COLUMN);
const rowKey = resolveKey(X_AXIS_ROW_KEY_COLUMN);

{
  const allLeaf = table.getAllLeafColumns();
  const fixedFromConfig = getFixedKeysForPivot(table, resolveKey);

 const isVisible = (k: string) =>
    !!allLeaf.find(
      (c) =>
        (c.columnDef as any).accessorKey === k &&
        c.getIsVisible?.()
    );

  const fixedVisibleKeys = fixedFromConfig.filter(isVisible);

  var fixedKeys =
    fixedVisibleKeys.length > 0 ? fixedVisibleKeys : fixedFromConfig;
}

const detailKeys = computeDetailKeys(
  fkKey,
  resolveKey(X_AXIS_LABEL_COLUMN) || fkKey,
  fixedKeys
);


                const groupOrder: any[] = [];
                const seen = new Set<string>();
                for (const r of visibleRows) {
                  const gv = (r.original as any)[fkKey];
                  const k = String(gv ?? "");
                  if (!seen.has(k)) { seen.add(k); groupOrder.push(gv); }
               }

                const pivot = new Map<string, { fixedRow: any | null; byGroup: Map<any, any> }>();
                for (const r of visibleRows) {
                  const rk = (r.original as any)[rowKey];
                  const fk = (r.original as any)[fkKey];
                  const key = String(rk ?? "");
                  if (!pivot.has(key)) pivot.set(key, { fixedRow: r.original, byGroup: new Map() });
                  const slot = pivot.get(key)!;
                  if (!slot.fixedRow) slot.fixedRow = r.original;
                  slot.byGroup.set(fk, r.original);
               }
                const pivotRows = Array.from(pivot.entries()); 
          let rowsToRender = pivotRows;
 if (xAxisGroupSort) {
   const chosenKey = xAxisGroupSort.detailKey || detailKeys[0];
   const def = getColDefByDataField(chosenKey);
   const colId = def ? resolveKey(def.dataField) : chosenKey;
const isNumeric =
      def?.columnType === "data_number" || def?.columnType === "input_number";
    const isDate =
      def?.columnType === "input_date" ||
      !!def?.inputDateFormat ||
      /data|date/i.test(String(def?.columnName || def?.dataField || ""));

const parseDateTs = (s: any): number => {
      return parseValueToTimestamp(s, def?.inputDateFormat);
    };
                  const toComparable = (v: any) => {
                    if (v == null) return null;
                    if (isNumeric) {
                      const n = typeof v === "number" ? v : parseNumberBR(String(v));
                      return isNaN(n) ? null : n;
                    }
                    if (isDate) {
        const ts = parseDateTs(v);
        return isNaN(ts) ? null : ts; 
      }
                    return String(v);
                  };
                  rowsToRender = [...pivotRows].sort((a, b) => {
                    const aRow = a[1].byGroup.get(xAxisGroupSort.groupKey) || {};
                    const bRow = b[1].byGroup.get(xAxisGroupSort.groupKey) || {};
                    const av = toComparable((aRow as any)[colId]);
                    const bv = toComparable((bRow as any)[colId]);
                    if (av === null && bv === null) return 0;
                    if (av === null) return 1;
                    if (bv === null) return -1;
                  let cmp = 0;
              if (isNumeric || isDate) {
                      cmp = (av as number) === (bv as number) ? 0 : (av as number) > (bv as number) ? 1 : -1;
                    } else {
                      cmp = String(av).localeCompare(String(bv), "pt-BR");
                    }
                    return xAxisGroupSort.dir === "asc" ? cmp : -cmp;
                  });
                }

const fixedKeysEff = fixedKeys; 
const stickyPivot = buildStickyMetaByKeys(table, fixedKeysEff);
const lastFixedKey = stickyPivot.orderedFixedKeys[stickyPivot.orderedFixedKeys.length - 1];


                        return rowsToRender.map(([rkStr, pack]) => {
                   const rowId = getRowIdValue(pack.fixedRow);
                   const isFiltered = highlightEnabled && selectedIds.length > 0;
                   const isActive = isFiltered && rowId !== undefined && selectedIds.includes(rowId);

                   const rowStyle: React.CSSProperties = {
                       minWidth: "max-content",
                       cursor: highlightEnabled ? "pointer" : "default",
                       opacity: isFiltered ? (isActive ? 1 : 0.35) : 1,
                       transition: "opacity 150ms ease-in-out",
                   };

                   const handleRowClick = (event: any) => {
                       if (!highlightEnabled) return;
                       const clickedId = getRowIdValue(pack.fixedRow);
                       if (clickedId === undefined) return;
                       const now = Date.now();
                       const last = lastHighlightClickRef.current;
                       if (last.id === clickedId && (now - last.t) < 180) return;
                       lastHighlightClickRef.current = { id: clickedId, t: now };

                       const multi = !!event?.ctrlKey || !!event?.metaKey;
                       let next = multi
                           ? (selectedIds.includes(clickedId) ? selectedIds.filter(id => id !== clickedId) : [...selectedIds, clickedId])
                           : (selectedIds.length === 1 && selectedIds[0] === clickedId ? [] : [clickedId]);
                       
                       setSelectedIds(next);
                       (async () => {
                           try {
                               if (HIGHLIGHT_VAR) await setVariableMitra({ name: HIGHLIGHT_VAR, content: next.join(",") || "" });
                               if ((window as any).updateComponentsMitra) (window as any).updateComponentsMitra({ all: true });
                           } catch (e) { console.error(e); }
                       })();
                   };

                   return (
                     <TableRow 
                       key={`rk-${rkStr}`} 
                       className={TABLE_DESIGN === "data" ? "data-row" : "classic-row"} 
                       style={rowStyle}      
                       onClick={handleRowClick}  
                     >
{fixedKeys.length > 0
  ? fixedKeys.map((k) => {
      const def = getColDefByDataField(k);
      const colId = def ? resolveKey(def.dataField) : k;
      const value = (pack.fixedRow as any)?.[colId];

      const col = table.getAllLeafColumns().find(
        c => (c.columnDef as any).accessorKey === colId
      );

      const alert = resolveAlertVisual(def as any, value);
const typeSafeToPaint =
  def?.columnType === "data_text" ||
  def?.columnType === "data_number" ||
  def?.columnType === "data_int" ||    
  def?.columnType === "data_iconphoto";

      const isBg = !!alert && alert.type === "bg" && !!typeSafeToPaint;

      const stickyInfo = stickyPivot.metaByAccessor[k];
      const isFixed = !!stickyInfo;
      const isLastFixed = isFixed && k === lastFixedKey;

const baseStyle: React.CSSProperties = {
  width: def?.width,
  minWidth: def?.width,
  maxWidth: def?.width,
  backgroundColor: "var(--row-bg, #fff)",
  ...(isBg ? { backgroundColor: alert!.color } : {}),
  ...(isFixed ? { left: `${stickyInfo.leftPx}px`, zIndex: 10, position: "sticky" as const } : {}),
};



      if (col) {
        const fakeCtx: any = { row: { original: pack.fixedRow }, getValue: () => value, column: col };
        const inner = flexRender(col.columnDef.cell, fakeCtx);
        const wrapped = isBg
          ? inner
          : wrapCellWithAlert(inner, alert, { invasiveOnInputs: !!typeSafeToPaint });

        return (
          <TableCell
            key={`fx-body-${k}`}
            className={cn(
              isBg ? "align-middle p-0" : "p-2 align-middle",
              isFixed && "sticky-col",
              isLastFixed && "sticky-right-shadow"
            )}
            style={baseStyle}
          >
            {wrapped}
          </TableCell>
        );
      }

      const wrappedPlain = isBg
        ? String(value ?? "")
        : wrapCellWithAlert(String(value ?? ""), alert, { invasiveOnInputs: !!typeSafeToPaint });

      return (
        <TableCell
          key={`fx-body-${k}`}
          className={cn(
            isBg ? "align-middle p-0" : "p-2 align-middle",
            isFixed && "sticky-col",
            isLastFixed && "sticky-right-shadow"
          )}
          style={baseStyle}
        >
          {wrappedPlain}
        </TableCell>
      );
})
        : null 
      }


                      {groupOrder.map((gVal, gi) =>
                        detailKeys.map((dk) => {
                          const def = getColDefByDataField(dk);
                          const colId = def ? resolveKey(def.dataField) : dk;
                          const rowForGroup = pack.byGroup.get(gVal) || {};
                          const value = (rowForGroup as any)?.[colId];
                         const col = table.getAllLeafColumns().find(c => (c.columnDef as any).accessorKey === colId);
const alert = resolveAlertVisual(def as any, value);
const typeSafeToPaint =
  def?.columnType === "data_text" ||
  def?.columnType === "data_number" ||
  def?.columnType === "data_iconphoto";

const isBg =
  !!alert && alert.type === "bg" &&
  !!(def?.columnType === "data_text" || def?.columnType === "data_number" || def?.columnType === "data_iconphoto");

if (col) {
  const fakeCtx: any = { row: { original: rowForGroup }, getValue: () => value, column: col };
  const inner = flexRender(col.columnDef.cell, fakeCtx);
  
  // ✅ PIVÔ: APLICAÇÃO DE ESTILO NAS SUBCOLUNAS
  const wrapped = isBg
    ? inner
    : wrapCellWithAlert(inner, alert, { invasiveOnInputs: !!(def?.columnType === "data_text" || def?.columnType === "data_number" || def?.columnType === "data_iconphoto") });

  return (
<TableCell
  key={`g-body-${gi}-${dk}`}
  className={isBg ? "align-middle p-0" : "p-2 align-middle"}
  style={{
    width: def?.width,
    minWidth: def?.width,
    maxWidth: def?.width,
    ...(isBg ? { backgroundColor: alert!.color } : { backgroundColor: "var(--row-bg, #fff)" }),
  }}
    >
      <div style={getConditionalTextStyle(String(value ?? ""), def as any)}>
         {wrapped}
      </div>
    </TableCell>
  );
}

const wrappedPlain = isBg
  ? String(value ?? "")
  : wrapCellWithAlert(String(value ?? ""), alert, { invasiveOnInputs: !!(def?.columnType === "data_text" || def?.columnType === "data_number" || def?.columnType === "data_iconphoto") });

return (
  <TableCell
    key={`g-body-plain-${gi}-${dk}`}
    className={isBg ? "align-middle p-0" : "p-2 align-middle"}
    style={{
      width: def?.width,
      minWidth: def?.width,
      maxWidth: def?.width,
      ...(isBg ? { backgroundColor: alert!.color } : {}),
      ...getConditionalTextStyle(String(value ?? ""), def as any) // ✅ APLICADO AQUI
    }}
  >
    {wrappedPlain}
  </TableCell>
);


                        })
                      )}
                    </TableRow>
                  );
                });
              })()}

</TableBody>

    {!paginacaoAtiva && (!XAXIS_HEADER_SUBGROUPS || !X_AXIS_FK_COLUMN) && Object.keys(queryBasedTotals).length > 0 && (
    <tfoot
      className={cn(
        "sticky bottom-0 z-20 totalizer",
        TABLE_DESIGN === "data" ? "bg-[#F8F9FA] border-t border-[#E5E7EB]" : "bg-white border-t"
      )}
      style={{ boxShadow: "inset 0 1px 0 #E5E7EB" }}
    >
      <tr className="totalizer-row">
        {(() => {
          const visibleColumns = table.getVisibleLeafColumns();

          let firstTotalIndex = visibleColumns.findIndex(col => {
            const def = col.columnDef as any;
            const key = typeof def?.accessorKey === "string" ? def.accessorKey : "";
            if (!key) return false;
            
            return queryBasedTotals[key] !== undefined;
          });

          if (firstTotalIndex === -1) {
            firstTotalIndex = visibleColumns.length;
          }

          return visibleColumns.map((col, idx) => {
            if (idx === 0) {
              return (
                <td
                  key="totalizer-label"
                  colSpan={firstTotalIndex === 0 ? 1 : firstTotalIndex}
                  className="p-2 text-sm font-medium totalizer-cell text-left text-slate-700"
                  style={{
                    background: TABLE_DESIGN === "data" ? "var(--totalizer-bg, #F8F9FA)" : "var(--totalizer-bg, white)",
                    position: "sticky",
                    bottom: 0,
                  }}
                >
                  Totais
                </td>
              );
            }

            if (idx < firstTotalIndex) {
              return null;
            }

            const def = col.columnDef as any;
            const key = typeof def?.accessorKey === "string" ? def.accessorKey : "";
            const colDefJson = finalColumnJSON.find(c => resolveKey(c.dataField) === key);
            const hasQueryTotal = key && queryBasedTotals[key] !== undefined;

            return (
<td
  key={col.id}
  className={cn("p-2 text-sm font-medium totalizer-cell", def?.cellClassName || "text-left")}
  style={{
    minWidth: def.width,
    background: TABLE_DESIGN === "data" ? "var(--totalizer-bg, #F8F9FA)" : "var(--totalizer-bg, white)",
    position: "sticky",
    bottom: 0,
  }}
>
  {(() => {
    if (hasQueryTotal) {
      const totalVal = queryBasedTotals[key];
      const places = colDefJson ? getDecimalPlacesForColumn(colDefJson) : 2;
return (totalVal ?? null) !== null ? formatNumberBRN(totalVal, places) : "—";

    }
    return "";
  })()}
</td>

            );
          });
        })()}
      </tr>
    </tfoot>
)}
</Table>
  )}
    </div>
</div>

      </div>
      {paginacaoAtiva && (
        <div 
          className={`flex items-center justify-end space-x-2 px-4 py-4 sticky bottom-0 z-20 sticky-footer ${
            TABLE_DESIGN === "data" ? "bg-[#F8F9FA] border-t border-[#E5E7EB]" : "bg-white border-t"
          }`}
        >
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
