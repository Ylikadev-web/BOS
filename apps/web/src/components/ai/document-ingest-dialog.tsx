"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  KeyRound,
  Loader2,
  Mail,
  Sparkles,
  Upload,
  AlertTriangle,
  FolderPlus,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  DocumentoAiResultado,
  ExpedienteTipo,
  SectorTipo,
} from "@ylika/shared";
import { formatCurrency } from "@ylika/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  analyzeDocument,
  GeminiRequiredError,
  getGeminiApiKey,
  isAllowedDocument,
  setGeminiApiKey,
} from "@/lib/ai-ingest";
import { expedienteHref } from "@/lib/routes";
import { useYlikaStore } from "@/lib/store";
import { labelIntencion } from "@ylika/shared";

type Step = "drop" | "analyzing" | "result" | "create";

function defaultsFromDoc(doc: DocumentoAiResultado) {
  const clienteNombre =
    doc.cliente?.trim() ||
    doc.entidadesDetectadas?.find(
      (e) => e.length > 4 && !/^rfc|\d{10,}/i.test(e),
    ) ||
    doc.proyecto?.trim() ||
    doc.proveedor?.trim() ||
    "";

  const expedienteNombre =
    doc.proyecto?.trim() ||
    (doc.intencion === "anexo_economico" || doc.intencion === "licitacion"
      ? doc.clasificacion
      : "") ||
    doc.concepto?.trim() ||
    doc.clasificacion;

  const tipo: ExpedienteTipo =
    doc.modalidad ||
    (doc.intencion === "anexo_economico" ||
    doc.intencion === "licitacion" ||
    doc.sector === "gobierno"
      ? "proyecto"
      : doc.intencion === "lista_productos"
        ? "proyecto"
        : "venta_directa");

  const sector: SectorTipo = doc.sector || "privado";

  return {
    clienteNombre,
    expedienteNombre,
    valor: String(doc.monto && doc.monto > 0 ? Math.round(doc.monto) : ""),
    rfc: doc.rfcReceptor || doc.rfcEmisor || "",
    tipo,
    sector,
  };
}

export function DocumentIngestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { runAction, expedientes, createFromDocumento } = useYlikaStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("drop");
  const [result, setResult] = useState<DocumentoAiResultado | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [creating, setCreating] = useState(false);

  const [clienteNombre, setClienteNombre] = useState("");
  const [expedienteNombre, setExpedienteNombre] = useState("");
  const [valor, setValor] = useState("");
  const [rfc, setRfc] = useState("");
  const [tipo, setTipo] = useState<ExpedienteTipo>("venta_directa");
  const [sector, setSector] = useState<SectorTipo>("privado");

  const reset = () => {
    setStep("drop");
    setResult(null);
    setDragging(false);
    setShowKey(false);
    setCreating(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  useEffect(() => {
    if (result && step === "create") {
      const d = defaultsFromDoc(result);
      setClienteNombre(d.clienteNombre);
      setExpedienteNombre(d.expedienteNombre);
      setValor(d.valor);
      setRfc(d.rfc);
      setTipo(d.tipo);
      setSector(d.sector);
    }
  }, [result, step]);

  const onOpenKey = () => {
    setApiKey(getGeminiApiKey());
    setHasKey(Boolean(getGeminiApiKey()));
    setShowKey(true);
  };

  const saveKey = () => {
    setGeminiApiKey(apiKey);
    setHasKey(Boolean(apiKey.trim()));
    setShowKey(false);
    toast.success(
      apiKey.trim()
        ? "Gemini configurado — listo para analizar PDFs e imágenes"
        : "Clave eliminada",
    );
  };

  const processFile = async (file: File) => {
    if (!isAllowedDocument(file)) {
      toast.error("Formato no soportado. Usa PDF, XML, Excel, imagen o correo.");
      return;
    }
    if (
      !getGeminiApiKey() &&
      !process.env.NEXT_PUBLIC_API_URL &&
      /\.pdf$/i.test(file.name)
    ) {
      toast.error("Configura Gemini (API key) para analizar PDFs");
      onOpenKey();
      return;
    }
    setStep("analyzing");
    try {
      const hints = expedientes.map((e) => ({
        codigo: e.codigo,
        nombre: e.nombre,
        clienteNombre: e.clienteNombre,
      }));
      const analyzed = await analyzeDocument(file, hints);
      setResult(analyzed);
      setStep("result");
      if (analyzed.provider === "gemini" || analyzed.provider === "api") {
        toast.success(
          `Gemini analizó el documento (${analyzed.model ?? "pro"})`,
        );
      } else if (analyzed.provider === "local") {
        toast.success("CFDI parseado localmente");
      } else {
        toast.message("Análisis limitado", {
          description: "Configura Gemini para extracción completa",
        });
      }
    } catch (e) {
      if (e instanceof GeminiRequiredError) {
        toast.error(e.message);
        setStep("drop");
        onOpenKey();
        return;
      }
      toast.error(
        e instanceof Error ? e.message : "No se pudo analizar el documento",
      );
      setStep("drop");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const associate = () => {
    if (!result?.expedienteSugerido?.codigo) {
      toast.error("No hay expediente sugerido");
      return;
    }
    const applied = runAction(
      result.expedienteSugerido.codigo,
      "asociar_documento",
      { documento: result },
    );
    if (!applied) {
      toast.error(
        `No se encontró ${result.expedienteSugerido.codigo} en este navegador`,
      );
      return;
    }
    toast.success(applied.message);
    handleClose(false);
    router.push(expedienteHref(result.expedienteSugerido.codigo));
  };

  const create = () => {
    if (!result) return;
    if (!clienteNombre.trim()) {
      toast.error(
        "Falta el cliente. Si Gemini no lo extrajo, escribe el nombre de la dependencia o empresa.",
      );
      return;
    }
    if (!expedienteNombre.trim()) {
      toast.error("Indica el nombre del expediente");
      return;
    }
    const monto = Number(String(valor).replace(/[^0-9.]/g, "")) || 0;
    setCreating(true);
    try {
      const { expediente, cliente } = createFromDocumento({
        documento: result,
        clienteNombre,
        expedienteNombre,
        valor: monto,
        sector,
        tipo,
        rfc,
      });
      toast.success(
        `${expediente.codigo} creado · ${cliente.nombre} · documento asociado`,
      );
      handleClose(false);
      router.push(expedienteHref(expediente.codigo));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear");
    } finally {
      setCreating(false);
    }
  };

  const providerLabel = (r: DocumentoAiResultado) => {
    if (r.provider === "gemini") return `Gemini · ${r.model ?? "2.5 Flash"}`;
    if (r.provider === "api") return "API YLIKA + Gemini";
    if (r.provider === "local") return "Parser CFDI local";
    return "Heurística local";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)]">
            Ingestión con IA
          </DialogTitle>
          <DialogDescription>
            Analiza el documento y crea cliente + expediente, o asócialo a uno
            existente.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.xml,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp,.gif,.eml,.msg,.txt,application/pdf,text/xml,image/*"
          onChange={onInputChange}
        />

        <AnimatePresence mode="wait">
          {step === "drop" && !showKey && (
            <motion.div
              key="drop"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="size-3.5 text-ylika-teal" />
                  {getGeminiApiKey() || process.env.NEXT_PUBLIC_API_URL
                    ? "Gemini listo para análisis multimodal"
                    : "Sin clave: solo heurística / CFDI XML"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2"
                  onClick={onOpenKey}
                >
                  <KeyRound className="size-3.5" />
                  API key
                </Button>
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition ${
                  dragging
                    ? "border-ylika-teal bg-ylika-teal-soft"
                    : "border-ylika-teal/40 bg-ylika-teal-soft/40 hover:border-ylika-teal hover:bg-ylika-teal-soft/70"
                }`}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-card shadow-sm">
                  <Upload className="size-5 text-ylika-teal" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Suelta un documento o haz clic
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PDF · XML · Excel · Imagen · Correo
                  </p>
                </div>
              </button>
              <div className="flex flex-wrap justify-center gap-2 text-muted-foreground">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="size-3" /> PDF
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileSpreadsheet className="size-3" /> Excel
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileText className="size-3" /> XML
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <ImageIcon className="size-3" /> Imagen
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Mail className="size-3" /> Correo
                </Badge>
              </div>
            </motion.div>
          )}

          {step === "drop" && showKey && (
            <motion.div
              key="key"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="gemini-key">
                  Google AI Studio · Gemini API key
                </Label>
                <Input
                  id="gemini-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza…"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Se guarda solo en este navegador. Obtén una clave en{" "}
                  <a
                    className="text-ylika-teal underline"
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google AI Studio
                  </a>
                  .
                </p>
                {hasKey && (
                  <p className="text-xs text-ylika-success">
                    Ya hay una clave guardada.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowKey(false)}>
                  Volver
                </Button>
                <Button
                  className="bg-ylika-teal hover:bg-ylika-teal/90"
                  onClick={saveKey}
                >
                  Guardar
                </Button>
              </div>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <Loader2 className="size-8 animate-spin text-ylika-teal" />
              <p className="font-medium">Gemini analizando documento…</p>
              <p className="text-sm text-muted-foreground">
                Clasificando · Extrayendo · Preparando expediente
              </p>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="size-4 text-ylika-success" />
                  <span className="truncate text-sm font-medium">
                    {result.archivo}
                  </span>
                  <Badge className="bg-ylika-teal-soft text-ylika-teal hover:bg-ylika-teal-soft">
                    {result.clasificacion}
                  </Badge>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {providerLabel(result)}
                    {result.confianzaExtraccion != null &&
                      ` · ${Math.round(result.confianzaExtraccion * 100)}%`}
                  </Badge>
                </div>

                {result.resumen && (
                  <p className="mb-3 text-sm leading-relaxed text-foreground/90">
                    {result.resumen}
                  </p>
                )}

                <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-secondary/60 px-2.5 py-2">
                    <p className="text-muted-foreground">Intención</p>
                    <p className="font-medium">
                      {labelIntencion(result.intencion)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/60 px-2.5 py-2">
                    <p className="text-muted-foreground">Sector</p>
                    <p className="font-medium">
                      {result.sector === "gobierno" ? "Gobierno" : "Privado"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/60 px-2.5 py-2 col-span-2">
                    <p className="text-muted-foreground">Siguiente paso</p>
                    <p className="font-medium">
                      {result.siguientePaso || "Revisar y crear expediente"}
                    </p>
                  </div>
                </div>

                {result.razonamiento && (
                  <details className="mb-3 rounded-lg border border-border/70 bg-secondary/30 px-3 py-2 text-xs">
                    <summary className="cursor-pointer font-medium text-muted-foreground">
                      Razonamiento de la IA
                    </summary>
                    <p className="mt-2 leading-relaxed text-foreground/80 whitespace-pre-wrap">
                      {result.razonamiento}
                    </p>
                  </details>
                )}

                {(result.provider === "heuristic" ||
                  (result.confianzaExtraccion != null &&
                    result.confianzaExtraccion < 0.35)) && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                      Este resultado no es un análisis multimodal completo.
                      Configura Gemini (API key) y vuelve a subir el PDF para
                      extraer cliente, sector y partidas reales.
                    </p>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {result.proveedor && (
                    <div>
                      <dt className="text-muted-foreground">Proveedor</dt>
                      <dd className="font-medium">{result.proveedor}</dd>
                    </div>
                  )}
                  {result.cliente && (
                    <div>
                      <dt className="text-muted-foreground">Cliente</dt>
                      <dd className="font-medium">{result.cliente}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Monto</dt>
                    <dd className="font-medium">
                      {result.monto != null
                        ? formatCurrency(result.monto)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Concepto</dt>
                    <dd className="font-medium">{result.concepto ?? "—"}</dd>
                  </div>
                  {result.proyecto && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Proyecto</dt>
                      <dd className="font-medium">{result.proyecto}</dd>
                    </div>
                  )}
                </dl>

                {result.riesgos && result.riesgos.length > 0 && (
                  <div className="mt-3 space-y-1 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                    {result.riesgos.map((r) => (
                      <p
                        key={r}
                        className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300"
                      >
                        <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                        {r}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-ylika-teal/30 bg-ylika-teal-soft/50 p-4 space-y-3">
                <p className="text-sm font-medium">
                  Acción principal: convertir este documento en operación
                </p>
                <Button
                  className="w-full gap-2 bg-ylika-teal hover:bg-ylika-teal/90"
                  onClick={() => setStep("create")}
                >
                  <FolderPlus className="size-4" />
                  Crear cliente + expediente
                </Button>
              </div>

              {result.expedienteSugerido && (
                <div className="rounded-xl border border-ylika-orange/30 bg-ylika-orange-soft p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ylika-orange">
                    O asociar a existente
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                    {result.expedienteSugerido.codigo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.expedienteSugerido.nombre} · Confianza{" "}
                    {Math.round(result.expedienteSugerido.confianza * 100)}%
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full gap-2"
                    onClick={associate}
                  >
                    <Link2 className="size-4" />
                    Asociar a este expediente
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => handleClose(false)}
              >
                Descartar
              </Button>
            </motion.div>
          )}

          {step === "create" && result && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Revisa los datos de{" "}
                <span className="font-medium text-foreground">
                  {result.archivo}
                </span>
                {result.intencion && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-ylika-teal">
                      {labelIntencion(result.intencion)}
                    </span>
                  </>
                )}
                . Se creará el cliente (si no existe), el expediente y se
                asociará el documento.
              </p>

              <div className="space-y-2">
                <Label htmlFor="doc-cli">Cliente / dependencia</Label>
                <Input
                  id="doc-cli"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre real extraído o capturado"
                />
                {!clienteNombre && (
                  <p className="text-xs text-amber-600">
                    Gemini no trajo cliente — captura el nombre del convocante o
                    empresa del documento.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-rfc">RFC (opcional)</Label>
                <Input
                  id="doc-rfc"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value)}
                  placeholder="XAXX010101000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-exp">Expediente / proyecto</Label>
                <Input
                  id="doc-exp"
                  value={expedienteNombre}
                  onChange={(e) => setExpedienteNombre(e.target.value)}
                  placeholder="Nombre del expediente"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={sector}
                    onValueChange={(v) => setSector(v as SectorTipo)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gobierno">Gobierno</SelectItem>
                      <SelectItem value="privado">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modalidad</Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v as ExpedienteTipo)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta_directa">
                        Venta Directa
                      </SelectItem>
                      <SelectItem value="proyecto">Proyecto</SelectItem>
                      <SelectItem value="servicio">Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-valor">Valor (MXN)</Label>
                <Input
                  id="doc-valor"
                  inputMode="numeric"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="150000"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep("result")}>
                  Volver
                </Button>
                <Button
                  className="gap-2 bg-ylika-teal hover:bg-ylika-teal/90"
                  onClick={create}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FolderPlus className="size-4" />
                  )}
                  Crear y abrir
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
