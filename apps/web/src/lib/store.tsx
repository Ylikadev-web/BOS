"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Cliente,
  ExpedienteNegocio,
  ExpedienteTipo,
} from "@ylika/shared";
import {
  clientes as seedClientes,
  expedientes as seedExpedientes,
} from "@/data/seed";

const STORAGE_KEY = "ylika-bos-v1";

type StoreState = {
  clientes: Cliente[];
  expedientes: ExpedienteNegocio[];
};

type YlikaStore = StoreState & {
  ready: boolean;
  addCliente: (input: {
    nombre: string;
    rfc?: string;
    industria?: string;
    creditoDisponible?: number;
  }) => Cliente;
  addExpediente: (input: {
    nombre: string;
    clienteId: string;
    tipo: ExpedienteTipo;
    valor: number;
  }) => ExpedienteNegocio;
  getExpedienteByCodigo: (codigo: string) => ExpedienteNegocio | undefined;
};

const Ctx = createContext<YlikaStore | null>(null);

function loadState(): StoreState {
  if (typeof window === "undefined") {
    return { clientes: seedClientes, expedientes: seedExpedientes };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clientes: seedClientes, expedientes: seedExpedientes };
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      clientes: parsed.clientes?.length ? parsed.clientes : seedClientes,
      expedientes: parsed.expedientes?.length
        ? parsed.expedientes
        : seedExpedientes,
    };
  } catch {
    return { clientes: seedClientes, expedientes: seedExpedientes };
  }
}

function nextCodigo(prefix: string, existing: string[]) {
  const nums = existing
    .map((c) => Number(c.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

function emptyResumen(valor: number) {
  return {
    montoVendido: valor,
    montoComprado: 0,
    facturadoCliente: 0,
    cobradoCliente: 0,
    facturadoProveedor: 0,
    pagadoProveedor: 0,
    utilidadBruta: 0,
    utilidadNeta: 0,
    margen: 0,
    roi: 0,
  };
}

export function YlikaStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>({
    clientes: seedClientes,
    expedientes: seedExpedientes,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const addCliente = useCallback(
    (input: {
      nombre: string;
      rfc?: string;
      industria?: string;
      creditoDisponible?: number;
    }) => {
      const cliente: Cliente = {
        id: `cli-${crypto.randomUUID().slice(0, 8)}`,
        codigo: nextCodigo(
          "CLI",
          state.clientes.map((c) => c.codigo),
        ),
        nombre: input.nombre.trim(),
        rfc: input.rfc?.trim() || "XAXX010101000",
        industria: input.industria?.trim() || "General",
        ejecutivo: "Ana Ruiz",
        expedientesActivos: 0,
        valorCartera: 0,
        creditoDisponible: input.creditoDisponible ?? 500000,
        estado: "activo",
      };
      setState((s) => ({ ...s, clientes: [cliente, ...s.clientes] }));
      return cliente;
    },
    [state.clientes],
  );

  const addExpediente = useCallback(
    (input: {
      nombre: string;
      clienteId: string;
      tipo: ExpedienteTipo;
      valor: number;
    }) => {
      const cliente = state.clientes.find((c) => c.id === input.clienteId);
      if (!cliente) throw new Error("Cliente no encontrado");

      const codigo = nextCodigo(
        "EXP",
        state.expedientes.map((e) => e.codigo),
      );

      const expediente: ExpedienteNegocio = {
        id: `exp-${crypto.randomUUID().slice(0, 8)}`,
        codigo,
        nombre: input.nombre.trim(),
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        tipo: input.tipo,
        valor: input.valor,
        estado: "cotizacion",
        avance: 5,
        rentabilidad: 0,
        ejecutivo: "Ana Ruiz",
        empresa: "YLIKA Operaciones",
        actualizadoEn: new Date().toISOString(),
        resumen: emptyResumen(input.valor),
        timeline: [
          {
            id: "t1",
            label: "Cotización",
            sublabel: "Borrador",
            estado: "activo",
            fecha: new Date().toISOString().slice(0, 10),
            monto: input.valor,
          },
          { id: "t2", label: "Pedido", estado: "pendiente" },
          { id: "t3", label: "Factura", estado: "pendiente" },
          { id: "t4", label: "Cobro", estado: "pendiente" },
        ],
        graph: {
          nodes: [
            {
              id: "n-exp",
              tipo: "expediente",
              titulo: codigo,
              subtitulo:
                input.tipo === "venta_directa"
                  ? "Venta Directa"
                  : input.tipo === "proyecto"
                    ? "Proyecto"
                    : "Servicio",
              estado: "activo",
              x: 380,
              y: 40,
            },
            {
              id: "n-cli",
              tipo: "cliente",
              titulo: cliente.nombre,
              subtitulo: "Cliente",
              estado: "completado",
              x: 140,
              y: 40,
            },
            {
              id: "n-cot",
              tipo: "cotizacion",
              titulo: "Cotización",
              subtitulo: "Borrador",
              monto: input.valor,
              estado: "activo",
              x: 280,
              y: 180,
            },
          ],
          edges: [
            { id: "e1", from: "n-cli", to: "n-exp" },
            { id: "e2", from: "n-exp", to: "n-cot" },
          ],
        },
        insights: [
          {
            id: "i1",
            severidad: "info",
            titulo: "Expediente creado",
            descripcion: "Listo para cotizar y relacionar documentos.",
            impacto: "Sin riesgo operativo aún.",
            recomendacion: "Carga la cotización o genera el pedido inicial.",
          },
        ],
      };

      setState((s) => ({
        clientes: s.clientes.map((c) =>
          c.id === cliente.id
            ? {
                ...c,
                expedientesActivos: c.expedientesActivos + 1,
                valorCartera: c.valorCartera + input.valor,
              }
            : c,
        ),
        expedientes: [expediente, ...s.expedientes],
      }));

      return expediente;
    },
    [state.clientes, state.expedientes],
  );

  const getExpedienteByCodigo = useCallback(
    (codigo: string) =>
      state.expedientes.find(
        (e) => e.codigo.toLowerCase() === decodeURIComponent(codigo).toLowerCase(),
      ),
    [state.expedientes],
  );

  const value = useMemo(
    () => ({
      ...state,
      ready,
      addCliente,
      addExpediente,
      getExpedienteByCodigo,
    }),
    [state, ready, addCliente, addExpediente, getExpedienteByCodigo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useYlikaStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useYlikaStore must be used within YlikaStoreProvider");
  return ctx;
}
