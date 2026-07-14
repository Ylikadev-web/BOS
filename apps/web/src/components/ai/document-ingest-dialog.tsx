"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { documentoAiDemo } from "@/data/seed";
import { formatCurrency } from "@ylika/shared";

type Step = "drop" | "analyzing" | "result";

export function DocumentIngestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("drop");
  const result = documentoAiDemo;

  const reset = () => setStep("drop");

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const simulateIngest = () => {
    setStep("analyzing");
    window.setTimeout(() => setStep("result"), 1600);
  };

  const associate = () => {
    toast.success(`Documento asociado a ${result.expedienteSugerido?.codigo}`);
    handleClose(false);
    router.push(`/operaciones/${result.expedienteSugerido?.codigo}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)]">
            Ingestión con IA
          </DialogTitle>
          <DialogDescription>
            Sube PDF, XML, Excel, imagen o correo. La IA clasifica, extrae y
            sugiere el expediente.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "drop" && (
            <motion.div
              key="drop"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={simulateIngest}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ylika-teal/40 bg-ylika-teal-soft/40 px-6 py-12 text-center transition hover:border-ylika-teal hover:bg-ylika-teal-soft/70"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <Upload className="size-5 text-ylika-teal" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Suelta un documento o haz clic
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Demo: cotizacion_cemex.pdf
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

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <Loader2 className="size-8 animate-spin text-ylika-teal" />
              <p className="font-medium">Analizando documento…</p>
              <p className="text-sm text-muted-foreground">
                Clasificando · Extrayendo · Buscando expediente
              </p>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-ylika-success" />
                  <span className="text-sm font-medium">{result.archivo}</span>
                  <Badge className="ml-auto bg-ylika-teal-soft text-ylika-teal hover:bg-ylika-teal-soft">
                    {result.clasificacion}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Proveedor</dt>
                    <dd className="font-medium">{result.proveedor}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Monto</dt>
                    <dd className="font-medium">
                      {formatCurrency(result.monto ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Concepto</dt>
                    <dd className="font-medium">{result.concepto}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Proyecto</dt>
                    <dd className="font-medium">{result.proyecto}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-ylika-orange/30 bg-ylika-orange-soft p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ylika-orange">
                  Posible coincidencia
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                  {result.expedienteSugerido?.codigo}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.expedienteSugerido?.nombre} · Confianza{" "}
                  {Math.round((result.expedienteSugerido?.confianza ?? 0) * 100)}
                  %
                </p>
                <p className="mt-3 text-sm">¿Desea asociar este documento?</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    className="bg-ylika-teal hover:bg-ylika-teal/90"
                    onClick={associate}
                  >
                    Asociar a expediente
                  </Button>
                  <Button variant="outline" onClick={() => handleClose(false)}>
                    Descartar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
