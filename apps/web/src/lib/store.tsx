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
  DocumentoAiResultado,
  ExpedienteNegocio,
  ExpedienteTipo,
  SectorTipo,
  Prospecto,
} from "@ylika/shared";
import {
  clientes as seedClientes,
  expedientes as seedExpedientes,
  prospectos as seedProspectos,
} from "@/data/seed";
import {
  applyExpedienteAction,
  type ActionId,
  type ActionResult,
} from "@/lib/expediente-actions";

const STORAGE_KEY = "ylika-bos-v3";

type StoreState = {
  clientes: Cliente[];
  expedientes: ExpedienteNegocio[];
  prospectos: Prospecto[];
};

type YlikaStore = StoreState & {
  ready: boolean;
  addCliente: (input: {
    nombre: string;
    rfc?: string;
    industria?: string;
    sector: SectorTipo;
    creditoDisponible?: number;
  }) => Cliente;
  addExpediente: (input: {
    nombre: string;
    clienteId: string;
    tipo: ExpedienteTipo;
    sector: SectorTipo;
    valor: number;
  }) => ExpedienteNegocio;
  getExpedienteByCodigo: (codigo: string) => ExpedienteNegocio | undefined;
  runAction: (
    codigo: string,
    actionId: ActionId,
    payload?: {
      insightId?: string;
      documento?: DocumentoAiResultado;
      monto?: number;
    },
  ) => ActionResult | null;
  convertProspecto: (prospectoId: string) => {
    cliente: Cliente;
    expediente: ExpedienteNegocio;
  };
};

const Ctx = createContext<YlikaStore | null>(null);

function migrateCliente(c: Cliente): Cliente {
  return { ...c, sector: c.sector ?? "privado" };
}

function migrateExpediente(e: ExpedienteNegocio): ExpedienteNegocio {
  return { ...e, sector: e.sector ?? "privado" };
}

function loadState(): StoreState {
  if (typeof window === "undefined") {
    return {
      clientes: seedClientes,
      expedientes: seedExpedientes,
      prospectos: seedProspectos,
    };
  }
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem("ylika-bos-v2") ??
      localStorage.getItem("ylika-bos-v1");
    if (!raw) {
      return {
        clientes: seedClientes,
        expedientes: seedExpedientes,
        prospectos: seedProspectos,
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    const clientes = (parsed.clientes?.length ? parsed.clientes : seedClientes).map(
      migrateCliente,
    );
    const expedientes = (
      parsed.expedientes?.length ? parsed.expedientes : seedExpedientes
    ).map(migrateExpediente);
    const prospectos = parsed.prospectos?.length
      ? parsed.prospectos
      : seedProspectos;
    return { clientes, expedientes, prospectos };
  } catch {
    return {
      clientes: seedClientes,
      expedientes: seedExpedientes,
      prospectos: seedProspectos,
    };
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
    prospectos: seedProspectos,
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
      sector: SectorTipo;
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
        sector: input.sector,
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
      sector: SectorTipo;
      valor: number;
    }) => {
      const cliente = state.clientes.find((c) => c.id === input.clienteId);
      if (!cliente) throw new Error("Cliente no encontrado");

      const codigo = nextCodigo(
        "EXP",
        state.expedientes.map((e) => e.codigo),
      );

      const modalidadLabel =
        input.tipo === "venta_directa"
          ? "Venta Directa"
          : input.tipo === "proyecto"
            ? "Proyecto"
            : "Servicio";

      const expediente: ExpedienteNegocio = {
        id: `exp-${crypto.randomUUID().slice(0, 8)}`,
        codigo,
        nombre: input.nombre.trim(),
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        tipo: input.tipo,
        sector: input.sector,
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
              subtitulo: `${modalidadLabel} · ${input.sector === "gobierno" ? "Gobierno" : "Privado"}`,
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
            descripcion: `Modalidad ${modalidadLabel} · Tipo ${input.sector === "gobierno" ? "Gobierno" : "Privado"}.`,
            impacto: "Sin riesgo operativo aún.",
            recomendacion: "Carga la cotización o genera el pedido inicial.",
          },
        ],
      };

      setState((s) => ({
        ...s,
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
        (e) =>
          e.codigo.toLowerCase() === decodeURIComponent(codigo).toLowerCase(),
      ),
    [state.expedientes],
  );

  const runAction = useCallback(
    (
      codigo: string,
      actionId: ActionId,
      payload?: {
        insightId?: string;
        documento?: DocumentoAiResultado;
        monto?: number;
      },
    ) => {
      let result: ActionResult | null = null;
      setState((s) => {
        const current = s.expedientes.find(
          (e) => e.codigo.toLowerCase() === codigo.toLowerCase(),
        );
        if (!current) return s;
        result = applyExpedienteAction(current, actionId, payload);
        return {
          ...s,
          expedientes: s.expedientes.map((e) =>
            e.codigo === current.codigo ? result!.expediente : e,
          ),
          clientes: s.clientes.map((c) =>
            c.id === result!.expediente.clienteId
              ? {
                  ...c,
                  valorCartera: Math.max(
                    c.valorCartera,
                    result!.expediente.valor,
                  ),
                }
              : c,
          ),
        };
      });
      return result;
    },
    [],
  );

  const convertProspecto = useCallback((prospectoId: string) => {
    const p = state.prospectos.find((x) => x.id === prospectoId);
    if (!p) throw new Error("Prospecto no encontrado");

    const cliente: Cliente = {
      id: `cli-${crypto.randomUUID().slice(0, 8)}`,
      codigo: nextCodigo(
        "CLI",
        state.clientes.map((c) => c.codigo),
      ),
      nombre: p.empresa,
      rfc: "XAXX010101000",
      industria: "Prospecto convertido",
      sector: "privado",
      ejecutivo: p.ejecutivo,
      expedientesActivos: 1,
      valorCartera: p.valorEstimado,
      creditoDisponible: 500000,
      estado: "activo",
    };

    const codigo = nextCodigo(
      "EXP",
      state.expedientes.map((e) => e.codigo),
    );

    const expediente: ExpedienteNegocio = {
      id: `exp-${crypto.randomUUID().slice(0, 8)}`,
      codigo,
      nombre: p.nombre,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      tipo: "proyecto",
      sector: "privado",
      valor: p.valorEstimado,
      estado: "cotizacion",
      avance: 5,
      rentabilidad: 0,
      ejecutivo: p.ejecutivo,
      empresa: "YLIKA Operaciones",
      actualizadoEn: new Date().toISOString(),
      resumen: emptyResumen(p.valorEstimado),
      timeline: [
        {
          id: "t1",
          label: "Cotización",
          sublabel: "Desde prospecto",
          estado: "activo",
          fecha: new Date().toISOString().slice(0, 10),
          monto: p.valorEstimado,
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
            subtitulo: "Proyecto · Privado",
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
            subtitulo: "Desde prospecto",
            monto: p.valorEstimado,
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
          titulo: "Convertido desde prospecto",
          descripcion: `${p.codigo} → cliente + expediente.`,
          impacto: "Embudo comercial cerrado en ganado.",
          recomendacion: "Crear pedido o enviar cotización.",
          accionId: "crear_pedido",
        },
      ],
    };

    setState((s) => ({
      ...s,
      clientes: [cliente, ...s.clientes],
      expedientes: [expediente, ...s.expedientes],
      prospectos: s.prospectos.map((x) =>
        x.id === prospectoId ? { ...x, etapa: "ganado" as const } : x,
      ),
    }));

    return { cliente, expediente };
  }, [state.clientes, state.expedientes, state.prospectos]);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      addCliente,
      addExpediente,
      getExpedienteByCodigo,
      runAction,
      convertProspecto,
    }),
    [
      state,
      ready,
      addCliente,
      addExpediente,
      getExpedienteByCodigo,
      runAction,
      convertProspecto,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useYlikaStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useYlikaStore must be used within YlikaStoreProvider");
  return ctx;
}
