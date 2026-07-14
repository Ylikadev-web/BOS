"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ExpedienteTipo, SectorTipo } from "@ylika/shared";
import { useYlikaStore } from "@/lib/store";
import { expedienteHref } from "@/lib/routes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateClienteDialog } from "@/components/clientes/create-cliente-dialog";

export function CreateExpedienteDialog({
  open,
  onOpenChange,
  defaultClienteId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClienteId?: string;
}) {
  const router = useRouter();
  const { clientes, addExpediente } = useYlikaStore();
  const [nombre, setNombre] = useState("");
  const [clienteId, setClienteId] = useState(defaultClienteId ?? "");
  const [modalidad, setModalidad] = useState<ExpedienteTipo>("venta_directa");
  const [sector, setSector] = useState<SectorTipo>("privado");
  const [valor, setValor] = useState("150000");
  const [createClienteOpen, setCreateClienteOpen] = useState(false);

  useEffect(() => {
    if (defaultClienteId) setClienteId(defaultClienteId);
  }, [defaultClienteId]);

  useEffect(() => {
    if (open && !clienteId && clientes[0]) setClienteId(clientes[0].id);
  }, [open, clienteId, clientes]);

  useEffect(() => {
    const cli = clientes.find((c) => c.id === clienteId);
    if (cli?.sector) setSector(cli.sector);
  }, [clienteId, clientes]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!nombre.trim()) {
        toast.error("El nombre del expediente es obligatorio");
        return;
      }
      if (!clienteId) {
        toast.error("Selecciona o crea un cliente primero");
        return;
      }
      if (!sector) {
        toast.error("Selecciona Tipo: Gobierno o Privado");
        return;
      }
      if (!modalidad) {
        toast.error("Selecciona la modalidad de operación");
        return;
      }
      const monto = Number(String(valor).replace(/[^0-9.]/g, ""));
      if (!monto || monto <= 0) {
        toast.error("Ingresa un valor válido");
        return;
      }

      const exp = addExpediente({
        nombre,
        clienteId,
        tipo: modalidad,
        sector,
        valor: monto,
      });
      toast.success(`${exp.codigo} creado`);
      onOpenChange(false);
      setNombre("");
      setModalidad("venta_directa");
      setValor("150000");
      router.push(expedienteHref(exp.codigo));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)]">
              Nuevo expediente
            </DialogTitle>
            <DialogDescription>
              Toda operación vive en un expediente ligado a un cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger className="w-full flex-1">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} · {c.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateClienteOpen(true)}
                >
                  + Cliente
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-nombre">Nombre del expediente / proyecto</Label>
              <Input
                id="exp-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. PLANTA NORTE"
                required
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
                  value={modalidad}
                  onValueChange={(v) => setModalidad(v as ExpedienteTipo)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venta_directa">Venta Directa</SelectItem>
                    <SelectItem value="proyecto">Proyecto</SelectItem>
                    <SelectItem value="servicio">Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-valor">Valor (MXN)</Label>
              <Input
                id="exp-valor"
                inputMode="numeric"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="150000"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-ylika-teal hover:bg-ylika-teal/90">
                Crear expediente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreateClienteDialog
        open={createClienteOpen}
        onOpenChange={setCreateClienteOpen}
        onCreated={(id) => setClienteId(id)}
      />
    </>
  );
}
