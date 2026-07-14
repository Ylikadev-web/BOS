import type {
  AiInsight,
  ExpedienteNegocio,
  GraphNode,
  TimelineEvent,
} from "@ylika/shared";
import type { DocumentoAiResultado } from "@ylika/shared";

export type ActionId =
  | "download_pdf"
  | "download_xml"
  | "crear_pedido"
  | "enviar_cliente"
  | "ver_surtido"
  | "generar_remision"
  | "registrar_cobro"
  | "conciliar"
  | "programar_saldo"
  | "solicitar_cfdi"
  | "registrar_recepcion"
  | "abrir_clausulado"
  | "ir_cliente"
  | "ver_credito"
  | "crear_tarea"
  | "notificar_comprador"
  | "ver_finanzas"
  | "aplicar_recomendacion"
  | "descartar_insight"
  | "asociar_documento"
  | "cerrar";

export type ActionResult = {
  expediente: ExpedienteNegocio;
  message: string;
  download?: { filename: string; content: string; mime: string };
  navigateTo?: string;
  focusFinanzas?: boolean;
  viewPayload?: { title: string; body: string };
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function markTimeline(
  events: TimelineEvent[],
  labelMatch: RegExp,
  patch: Partial<TimelineEvent>,
): TimelineEvent[] {
  let found = false;
  const next = events.map((e) => {
    if (!found && labelMatch.test(e.label)) {
      found = true;
      return { ...e, ...patch };
    }
    return e;
  });
  if (!found) {
    next.push({
      id: uid("t"),
      label: patch.label ?? "Evento",
      sublabel: patch.sublabel,
      estado: patch.estado ?? "activo",
      fecha: patch.fecha ?? today(),
      monto: patch.monto,
    });
  }
  return next;
}

function upsertNode(
  exp: ExpedienteNegocio,
  node: GraphNode,
  edgeFrom?: string,
): ExpedienteNegocio["graph"] {
  const nodes = [...exp.graph.nodes];
  const idx = nodes.findIndex(
    (n) => n.tipo === node.tipo && n.titulo === node.titulo,
  );
  if (idx >= 0) nodes[idx] = { ...nodes[idx], ...node };
  else nodes.push(node);

  const edges = [...exp.graph.edges];
  if (edgeFrom) {
    const exists = edges.some((e) => e.from === edgeFrom && e.to === node.id);
    if (!exists) {
      edges.push({ id: uid("e"), from: edgeFrom, to: node.id });
    }
  }
  return { nodes, edges };
}

function addInsight(
  insights: AiInsight[],
  insight: AiInsight,
): AiInsight[] {
  return [insight, ...insights.filter((i) => i.id !== insight.id)];
}

function downloadCotizacion(exp: ExpedienteNegocio) {
  const content = [
    `YLIKA — Cotización`,
    `Expediente: ${exp.codigo}`,
    `Cliente: ${exp.clienteNombre}`,
    `Fecha: ${today()}`,
    `Monto: ${exp.valor}`,
    `Sector: ${exp.sector}`,
    `Modalidad: ${exp.tipo}`,
    ``,
    `Partidas:`,
    `1. Alcance principal — ${Math.round(exp.valor * 0.72)}`,
    `2. Supervisión — ${Math.round(exp.valor * 0.18)}`,
    `3. Logística — ${Math.round(exp.valor * 0.1)}`,
  ].join("\n");
  return {
    filename: `COT-${exp.codigo}.txt`,
    content,
    mime: "text/plain;charset=utf-8",
  };
}

function downloadXml(exp: ExpedienteNegocio) {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Total="${exp.valor}" Fecha="${today()}">
  <cfdi:Emisor Nombre="YLIKA Operaciones"/>
  <cfdi:Receptor Nombre="${exp.clienteNombre}"/>
  <cfdi:Conceptos>
    <cfdi:Concepto Descripcion="Servicios ${exp.nombre}" Importe="${exp.valor}"/>
  </cfdi:Conceptos>
</cfdi:Comprobante>`;
  return {
    filename: `FAC-${exp.codigo}.xml`,
    content,
    mime: "application/xml",
  };
}

export function applyExpedienteAction(
  exp: ExpedienteNegocio,
  actionId: ActionId,
  payload?: {
    insightId?: string;
    documento?: DocumentoAiResultado;
    monto?: number;
  },
): ActionResult {
  let next: ExpedienteNegocio = {
    ...exp,
    actualizadoEn: new Date().toISOString(),
  };

  switch (actionId) {
    case "download_pdf":
    case "abrir_clausulado": {
      const file = downloadCotizacion(next);
      next = {
        ...next,
        timeline: markTimeline(next.timeline, /cotiz|contrato/i, {
          sublabel: "Documento generado",
          estado: "completado",
          fecha: today(),
        }),
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "info",
          titulo: "Documento descargado",
          descripcion: `${file.filename} generado desde el expediente.`,
          impacto: "Sin impacto operativo.",
          recomendacion: "Comparte el archivo con el cliente si aplica.",
        }),
      };
      return {
        expediente: next,
        message: `${file.filename} listo`,
        download: file,
      };
    }

    case "download_xml": {
      const file = downloadXml(next);
      return {
        expediente: next,
        message: "XML CFDI generado",
        download: file,
      };
    }

    case "enviar_cliente": {
      next = {
        ...next,
        timeline: markTimeline(next.timeline, /cotiz/i, {
          sublabel: "Enviada al cliente",
          estado: "completado",
          fecha: today(),
          monto: next.valor,
        }),
        graph: {
          ...next.graph,
          nodes: next.graph.nodes.map((n) =>
            n.tipo === "cotizacion"
              ? { ...n, subtitulo: "Enviada", estado: "completado" as const }
              : n,
          ),
        },
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "info",
          titulo: "Cotización enviada",
          descripcion: `Se registró el envío a ${next.clienteNombre}.`,
          impacto: "Esperando respuesta comercial.",
          recomendacion: "Da seguimiento en 48h.",
          accionId: "crear_tarea",
        }),
      };
      return { expediente: next, message: "Cotización marcada como enviada" };
    }

    case "crear_pedido": {
      const pedId = "n-ped-auto";
      next = {
        ...next,
        estado: next.estado === "cotizacion" ? "ejecucion" : next.estado,
        avance: Math.max(next.avance, 25),
        timeline: markTimeline(
          markTimeline(next.timeline, /cotiz/i, {
            estado: "completado",
            sublabel: "Aprobada",
            fecha: today(),
          }),
          /pedido/i,
          {
            label: "Pedido",
            sublabel: `PV-${next.codigo.replace("EXP-", "")}`,
            estado: "activo",
            fecha: today(),
            monto: next.valor,
          },
        ),
        graph: upsertNode(
          next,
          {
            id: pedId,
            tipo: "pedido",
            titulo: "Pedido",
            subtitulo: "Pedido Creado",
            monto: next.valor,
            estado: "activo",
            x: 420,
            y: 180,
          },
          "n-cot",
        ),
        insights: addInsight(
          next.insights.filter((i) => !/pedido inicial|cotización/i.test(i.recomendacion)),
          {
            id: uid("i"),
            severidad: "info",
            titulo: "Pedido creado",
            descripcion: "El pedido de venta quedó ligado a la cotización.",
            impacto: "Puedes generar remisión y facturar.",
            recomendacion: "Generar remisión cuando haya surtido.",
            accionId: "generar_remision",
            entidadRelacionada: `PV-${next.codigo.replace("EXP-", "")}`,
          },
        ),
      };
      return { expediente: next, message: "Pedido de venta creado en el expediente" };
    }

    case "ver_surtido": {
      return {
        expediente: next,
        message: "Surtido del pedido",
        viewPayload: {
          title: "Surtido / almacén",
          body: `Pedido PV-${next.codigo.replace("EXP-", "")}\nCliente: ${next.clienteNombre}\nEstado: Pendiente de surtir\nAlmacén: CDMX Norte\nLíneas: 1 partida · ${next.valor} MXN`,
        },
      };
    }

    case "generar_remision": {
      next = {
        ...next,
        avance: Math.max(next.avance, 40),
        timeline: [
          ...markTimeline(next.timeline, /pedido/i, {
            estado: "completado",
            sublabel: "Surtido",
          }),
          {
            id: uid("t"),
            label: "Remisión",
            sublabel: `REM-${next.codigo.replace("EXP-", "")}`,
            estado: "completado",
            fecha: today(),
          },
        ],
        graph: upsertNode(
          {
            ...next,
            graph: upsertNode(next, {
              id: "n-ped-auto",
              tipo: "pedido",
              titulo: "Pedido",
              subtitulo: "Completado",
              monto: next.valor,
              estado: "completado",
              x: 420,
              y: 180,
            }),
          },
          {
            id: "n-rem",
            tipo: "pedido",
            titulo: "Remisión",
            subtitulo: "Emitida",
            estado: "completado",
            x: 560,
            y: 180,
          },
          "n-ped-auto",
        ),
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "info",
          titulo: "Remisión emitida",
          descripcion: "Listo para facturar al cliente.",
          impacto: "Avance operativo registrado.",
          recomendacion: "Emitir factura cliente.",
          accionId: "registrar_cobro",
        }),
      };
      return { expediente: next, message: "Remisión generada y ligada al pedido" };
    }

    case "registrar_cobro": {
      const pendienteCalc = Math.max(0, next.valor - next.resumen.cobradoCliente);
      const monto =
        payload?.monto ??
        (pendienteCalc > 0
          ? Math.min(pendienteCalc, Math.round(next.valor * 0.4) || pendienteCalc)
          : Math.round(next.valor * 0.4));
      const cobrado = next.resumen.cobradoCliente + monto;
      const pendiente = Math.max(0, next.valor - cobrado);
      next = {
        ...next,
        estado: pendiente === 0 ? "cerrado" : "cobranza",
        avance: Math.min(100, Math.max(next.avance, pendiente === 0 ? 100 : 82)),
        resumen: {
          ...next.resumen,
          facturadoCliente: Math.max(next.resumen.facturadoCliente, next.valor),
          cobradoCliente: cobrado,
          utilidadBruta: next.valor - next.resumen.montoComprado,
          utilidadNeta: cobrado - next.resumen.pagadoProveedor,
          margen:
            next.valor > 0
              ? Math.round(
                  ((next.valor - next.resumen.montoComprado) / next.valor) * 100,
                )
              : 0,
        },
        timeline: markTimeline(next.timeline, /cobr|factura/i, {
          label: "Cobro",
          sublabel: pendiente ? `Parcial · falta ${pendiente}` : "Liquidado",
          estado: pendiente ? "activo" : "completado",
          fecha: today(),
          monto: cobrado,
        }),
        graph: upsertNode(
          next,
          {
            id: "n-cob-auto",
            tipo: "cobro",
            titulo: "Cobrado",
            subtitulo: `$${cobrado.toLocaleString("es-MX")}`,
            monto: cobrado,
            estado: pendiente ? "activo" : "completado",
            x: 700,
            y: 180,
          },
          "n-fac",
        ),
        insights: addInsight(
          next.insights.filter((i) => !/cobranza|cobro/i.test(i.titulo)),
          pendiente
            ? {
                id: uid("i"),
                severidad: "warning",
                titulo: "Cobranza parcial",
                descripcion: `Quedan $${pendiente.toLocaleString("es-MX")} pendientes.`,
                impacto: "Flujo de caja debajo del plan.",
                recomendacion: "Programar seguimiento de saldo.",
                accionId: "programar_saldo",
                entidadRelacionada: `FAC-${next.codigo.replace("EXP-", "")}`,
              }
            : {
                id: uid("i"),
                severidad: "info",
                titulo: "Cobrado al 100%",
                descripcion: "El expediente quedó liquidado del lado cliente.",
                impacto: "Mejora de caja.",
                recomendacion: "Revisar rentabilidad final.",
                accionId: "ver_finanzas",
              },
        ),
      };
      return { expediente: next, message: `Cobro registrado: $${monto.toLocaleString("es-MX")}` };
    }

    case "conciliar": {
      next = {
        ...next,
        timeline: markTimeline(next.timeline, /cobr/i, {
          sublabel: "Conciliado bancario",
          estado: "completado",
          fecha: today(),
        }),
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "info",
          titulo: "Cobro conciliado",
          descripcion: "El movimiento quedó conciliado con la cuenta bancaria.",
          impacto: "Tesorería actualizada.",
          recomendacion: "Sin acción adicional.",
        }),
      };
      return { expediente: next, message: "Cobro conciliado con banco" };
    }

    case "programar_saldo": {
      next = {
        ...next,
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "warning",
          titulo: "Seguimiento de saldo programado",
          descripcion: `Recordatorio creado para ${next.clienteNombre}.`,
          impacto: "Reduce riesgo de cartera vencida.",
          recomendacion: "Ejecutar cobranza en la fecha programada.",
          accionId: "registrar_cobro",
          entidadRelacionada: "COBRANZA",
        }),
        timeline: [
          ...next.timeline,
          {
            id: uid("t"),
            label: "Seguimiento cobranza",
            sublabel: "Programado",
            estado: "activo",
            fecha: today(),
          },
        ],
      };
      return { expediente: next, message: "Seguimiento de saldo programado" };
    }

    case "solicitar_cfdi": {
      next = {
        ...next,
        insights: next.insights
          .map((i) =>
            /cfdi|factura proveedor|oc-002|sin facturar/i.test(
              `${i.titulo} ${i.descripcion} ${i.entidadRelacionada ?? ""}`,
            )
              ? {
                  ...i,
                  titulo: "CFDI solicitado",
                  descripcion: "Se envió solicitud de CFDI al proveedor.",
                  severidad: "info" as const,
                  recomendacion: "Esperar XML del proveedor.",
                  resuelto: false,
                  accionId: "registrar_recepcion",
                }
              : i,
          )
          .concat([
            {
              id: uid("i"),
              severidad: "info",
              titulo: "Solicitud CFDI enviada",
              descripcion: "Compras notificó al proveedor.",
              impacto: "Reduce riesgo de retraso documental.",
              recomendacion: "Registrar recepción al llegar el CFDI.",
              accionId: "registrar_recepcion",
            },
          ]),
        timeline: [
          ...next.timeline,
          {
            id: uid("t"),
            label: "Solicitud CFDI",
            sublabel: "Proveedor notificado",
            estado: "activo",
            fecha: today(),
          },
        ],
      };
      return { expediente: next, message: "Solicitud de CFDI enviada al proveedor" };
    }

    case "registrar_recepcion": {
      const comprado = Math.max(next.resumen.montoComprado, Math.round(next.valor * 0.35));
      next = {
        ...next,
        resumen: {
          ...next.resumen,
          montoComprado: comprado,
          facturadoProveedor: comprado,
          utilidadBruta: next.valor - comprado,
          margen:
            next.valor > 0
              ? Math.round(((next.valor - comprado) / next.valor) * 100)
              : 0,
        },
        rentabilidad:
          next.valor > 0
            ? Math.round(((next.valor - comprado) / next.valor) * 100)
            : next.rentabilidad,
        timeline: [
          ...next.timeline,
          {
            id: uid("t"),
            label: "Recepción / CFDI",
            sublabel: "Registrado",
            estado: "completado",
            fecha: today(),
            monto: comprado,
          },
        ],
        graph: upsertNode(
          next,
          {
            id: "n-fp-auto",
            tipo: "factura",
            titulo: "Factura Proveedor",
            subtitulo: "Recibida",
            monto: comprado,
            estado: "completado",
            x: 420,
            y: 300,
          },
          "n-oc",
        ),
        insights: next.insights.filter(
          (i) => !/riesgo|cfdi|sin facturar|retraso/i.test(`${i.titulo} ${i.descripcion}`),
        ),
      };
      return { expediente: next, message: "Recepción y CFDI proveedor registrados" };
    }

    case "crear_tarea": {
      next = {
        ...next,
        timeline: [
          ...next.timeline,
          {
            id: uid("t"),
            label: "Tarea operativa",
            sublabel: "Asignada a operaciones",
            estado: "activo",
            fecha: today(),
          },
        ],
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "info",
          titulo: "Tarea creada",
          descripcion: "Quedó una tarea activa en el timeline del expediente.",
          impacto: "Seguimiento operativo visible.",
          recomendacion: "Completar y cerrar la tarea.",
        }),
      };
      return { expediente: next, message: "Tarea creada en el timeline" };
    }

    case "notificar_comprador": {
      next = {
        ...next,
        timeline: [
          ...next.timeline,
          {
            id: uid("t"),
            label: "Notificación a compras",
            sublabel: "Enviada",
            estado: "completado",
            fecha: today(),
          },
        ],
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "info",
          titulo: "Comprador notificado",
          descripcion: "Se alertó al rol comprador sobre el riesgo detectado.",
          impacto: "Acelera respuesta de compras.",
          recomendacion: "Solicitar CFDI si aún falta.",
          accionId: "solicitar_cfdi",
        }),
      };
      return { expediente: next, message: "Comprador notificado" };
    }

    case "ver_credito": {
      return {
        expediente: next,
        message: "Crédito del cliente",
        viewPayload: {
          title: `Crédito · ${next.clienteNombre}`,
          body: `Cliente: ${next.clienteNombre}\nExpediente: ${next.codigo}\nValor operación: ${next.valor}\nEstado: Activo\nNota: El detalle completo vive en Clientes.`,
        },
        navigateTo: "/clientes",
      };
    }

    case "ir_cliente": {
      return {
        expediente: next,
        message: "Abriendo clientes",
        navigateTo: "/clientes",
      };
    }

    case "ver_finanzas": {
      return {
        expediente: next,
        message: "Resumen financiero",
        focusFinanzas: true,
        viewPayload: {
          title: "Resumen financiero",
          body: [
            `Vendido: ${next.resumen.montoVendido}`,
            `Comprado: ${next.resumen.montoComprado}`,
            `Facturado cliente: ${next.resumen.facturadoCliente}`,
            `Cobrado: ${next.resumen.cobradoCliente}`,
            `Facturado proveedor: ${next.resumen.facturadoProveedor}`,
            `Pagado proveedor: ${next.resumen.pagadoProveedor}`,
            `Utilidad bruta: ${next.resumen.utilidadBruta}`,
            `Margen: ${next.resumen.margen}%`,
            `ROI: ${next.resumen.roi}%`,
          ].join("\n"),
        },
      };
    }

    case "asociar_documento": {
      const doc = payload?.documento;
      if (!doc) {
        return { expediente: next, message: "Sin documento" };
      }
      const nodeTipo =
        doc.intencion === "cobro" || /cobr/i.test(doc.clasificacion)
          ? "cobro"
          : doc.intencion === "pago"
            ? "pago"
            : doc.intencion === "orden_compra" ||
                /orden|compra/i.test(doc.clasificacion)
              ? "compra"
              : doc.intencion === "cotizacion_proveedor" ||
                  doc.intencion === "cotizacion_venta" ||
                  doc.intencion === "anexo_economico" ||
                  doc.intencion === "lista_productos" ||
                  /cotiz|anexo|lista/i.test(doc.clasificacion)
                ? "cotizacion"
                : doc.intencion === "contrato" || /contrato/i.test(doc.clasificacion)
                  ? "contrato"
                  : /factura|cfdi/i.test(doc.clasificacion) ||
                      doc.intencion === "factura_cliente" ||
                      doc.intencion === "factura_proveedor"
                    ? "factura"
                    : "factura";
      const nodeId = uid("n-doc");
      next = {
        ...next,
        timeline: [
          ...next.timeline,
          {
            id: uid("t"),
            label: doc.clasificacion,
            sublabel: doc.archivo,
            estado: "completado",
            fecha: today(),
            monto: doc.monto,
          },
        ],
        graph: upsertNode(
          next,
          {
            id: nodeId,
            tipo: nodeTipo,
            titulo: doc.clasificacion,
            subtitulo: doc.archivo,
            monto: doc.monto,
            estado: "completado",
            x: 200 + next.graph.nodes.length * 20,
            y: 320,
          },
          "n-exp",
        ),
        insights: addInsight(next.insights, {
          id: uid("i"),
          severidad: "info",
          titulo: "Documento asociado",
          descripcion: `${doc.archivo} quedó ligado a ${next.codigo}.`,
          impacto: "Historia documental del expediente actualizada.",
          recomendacion: "Revisa el nodo nuevo en el Business Graph.",
        }),
      };
      return { expediente: next, message: `${doc.archivo} asociado a ${next.codigo}` };
    }

    case "aplicar_recomendacion": {
      const insight = next.insights.find((i) => i.id === payload?.insightId);
      const nested = (insight?.accionId as ActionId) || "crear_tarea";
      const applied = applyExpedienteAction(next, nested, payload);
      return {
        ...applied,
        expediente: {
          ...applied.expediente,
          insights: applied.expediente.insights.filter(
            (i) => i.id !== payload?.insightId,
          ),
        },
        message: applied.message,
      };
    }

    case "descartar_insight": {
      next = {
        ...next,
        insights: next.insights.filter((i) => i.id !== payload?.insightId),
      };
      return { expediente: next, message: "Insight descartado" };
    }

    case "cerrar":
    default:
      return { expediente: next, message: "Cerrado" };
  }
}

export function triggerBrowserDownload(file: {
  filename: string;
  content: string;
  mime: string;
}) {
  const blob = new Blob([file.content], { type: file.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.filename;
  a.click();
  URL.revokeObjectURL(url);
}
