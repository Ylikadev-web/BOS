"use client";

import { useState } from "react";
import { toast } from "sonner";
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

export function CreateClienteDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (clienteId: string) => void;
}) {
  const { addCliente } = useYlikaStore();
  const [nombre, setNombre] = useState("");
  const [rfc, setRfc] = useState("");
  const [industria, setIndustria] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    const cliente = addCliente({
      nombre,
      rfc,
      industria,
    });
    toast.success(`Cliente ${cliente.codigo} creado`);
    setNombre("");
    setRfc("");
    setIndustria("");
    onOpenChange(false);
    onCreated?.(cliente.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)]">
            Nuevo cliente
          </DialogTitle>
          <DialogDescription>
            El cliente podrá tener expedientes de negocio asociados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cli-nombre">Nombre</Label>
            <Input
              id="cli-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. SHAMOSH"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-rfc">RFC</Label>
            <Input
              id="cli-rfc"
              value={rfc}
              onChange={(e) => setRfc(e.target.value.toUpperCase())}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-ind">Industria</Label>
            <Input
              id="cli-ind"
              value={industria}
              onChange={(e) => setIndustria(e.target.value)}
              placeholder="Construcción, Manufactura…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-ylika-teal hover:bg-ylika-teal/90">
              Crear cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
