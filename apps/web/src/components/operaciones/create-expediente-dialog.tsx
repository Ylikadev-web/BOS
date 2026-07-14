"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ExpedienteTipo } from "@ylika/shared";
import { useYlikaStore } from "@/lib/store";
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
  const [tipo, setTipo] = useState<ExpedienteTipo>("proyecto");
  const [valor, setValor] = useState("150000");
  const [createClienteOpen, setCreateClienteOpen] = useState(false);

  useEffect(() => {
    if (defaultClienteId) setClienteId(defaultClienteId);
  }, [defaultClienteId]);

  useEffect(() => {
    if (open && !clienteId && clientes[0]) setClienteId(clientes[0].id);
  }, [open, clienteId, clientes]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre del expediente es obligatorio");
      return;
    }
    if (!clienteId) {
      toast.error("Selecciona o crea un cliente primero");
      return;
    }
    const monto = Number(valor.replace(/,/g, ""));
    if (!monto || monto <= 0) {
      toast.error("Ingresa un valor válido");
      return;
    }

    const exp = addExpediente({
      nombre,
      clienteId,
      tipo,
      valor: monto,
    });
    toast.success(`${exp.codigo} creado`);
    onOpenChange(false);
    setNombre("");
    router.push(`/operaciones/${exp.codigo}`);
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
                  <SelectTrigger className="flex-1">
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
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={tipo}
                  onValueChange={(v) => setTipo(v as ExpedienteTipo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proyecto">Proyecto</SelectItem>
                    <SelectItem value="venta_directa">Venta Directa</SelectItem>
                    <SelectItem value="servicio">Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-valor">Valor</Label>
                <Input
                  id="exp-valor"
                  inputMode="numeric"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="150000"
                />
              </div>
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
