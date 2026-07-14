-- YLIKA Business Operating System
-- Schema centrado en EXPEDIENTE_NEGOCIO
-- PostgreSQL + pgvector (Supabase)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- EMPRESA_GRUPO / EMPRESA
-- ============================================================

CREATE TABLE empresa_grupo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID REFERENCES empresa_grupo(id),
  nombre TEXT NOT NULL,
  rfc TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operaciones',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id),
  banco TEXT NOT NULL,
  clabe TEXT,
  moneda TEXT NOT NULL DEFAULT 'MXN',
  saldo NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROSPECTOS
-- ============================================================

CREATE TABLE prospectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  empresa_prospecto TEXT,
  etapa TEXT NOT NULL DEFAULT 'nuevo',
  valor_estimado NUMERIC(18,2) DEFAULT 0,
  probabilidad NUMERIC(5,2) DEFAULT 0,
  ejecutivo_id UUID REFERENCES usuarios(id),
  origen TEXT,
  ultimo_contacto TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospecto_id UUID REFERENCES prospectos(id),
  cliente_id UUID,
  expediente_id UUID,
  codigo TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cotizacion_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  cantidad NUMERIC(18,4) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE seguimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospecto_id UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nota TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id UUID REFERENCES usuarios(id)
);

CREATE TABLE actividades_comerciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospecto_id UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  resultado TEXT
);

CREATE TABLE archivos_comerciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospecto_id UUID REFERENCES prospectos(id),
  expediente_id UUID,
  nombre TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT,
  clasificacion_ia TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CLIENTES
-- ============================================================

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id),
  prospecto_id UUID REFERENCES prospectos(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rfc TEXT,
  industria TEXT,
  ejecutivo_id UUID REFERENCES usuarios(id),
  estado TEXT NOT NULL DEFAULT 'activo',
  credito_limite NUMERIC(18,2) DEFAULT 0,
  credito_usado NUMERIC(18,2) DEFAULT 0,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

CREATE TABLE contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  puesto TEXT,
  principal BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE contacto_medio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('telefono', 'correo', 'whatsapp')),
  valor TEXT NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE direcciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'fiscal',
  calle TEXT,
  ciudad TEXT,
  estado TEXT,
  cp TEXT,
  pais TEXT DEFAULT 'MX'
);

CREATE TABLE condiciones_comerciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  dias_credito INTEGER DEFAULT 30,
  descuento_max NUMERIC(5,2) DEFAULT 0,
  moneda TEXT DEFAULT 'MXN'
);

-- ============================================================
-- EXPEDIENTE_NEGOCIO (núcleo del sistema)
-- ============================================================

CREATE TABLE expedientes_negocio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('venta_directa', 'proyecto', 'servicio')),
  valor NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'cotizacion',
  avance NUMERIC(5,2) NOT NULL DEFAULT 0,
  rentabilidad NUMERIC(5,2) NOT NULL DEFAULT 0,
  ejecutivo_id UUID REFERENCES usuarios(id),
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

ALTER TABLE cotizaciones
  ADD CONSTRAINT cotizaciones_cliente_fk FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  ADD CONSTRAINT cotizaciones_expediente_fk FOREIGN KEY (expediente_id) REFERENCES expedientes_negocio(id);

ALTER TABLE archivos_comerciales
  ADD CONSTRAINT archivos_expediente_fk FOREIGN KEY (expediente_id) REFERENCES expedientes_negocio(id);

-- Venta directa
CREATE TABLE pedidos_venta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  codigo TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'creado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pedido_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_venta(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  cantidad NUMERIC(18,4) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE remisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_venta(id),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  codigo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'emitida',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE remision_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remision_id UUID NOT NULL REFERENCES remisiones(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  cantidad NUMERIC(18,4) NOT NULL DEFAULT 1
);

CREATE TABLE facturas_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  remision_id UUID REFERENCES remisiones(id),
  codigo TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'emitida',
  uuid_fiscal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cobros_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  factura_id UUID REFERENCES facturas_cliente(id),
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  cuenta_bancaria_id UUID REFERENCES cuentas_bancarias(id)
);

-- Proyecto
CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  codigo TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador',
  firmado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  contrato_id UUID REFERENCES contratos(id),
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'iniciado',
  avance NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE proyecto_actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_limite DATE
);

CREATE TABLE proyecto_entregables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE TABLE ingenieria_costos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE detalle_cotizacion_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingenieria_id UUID NOT NULL REFERENCES ingenieria_costos(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE detalle_cotizacion_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingenieria_id UUID NOT NULL REFERENCES ingenieria_costos(id) ON DELETE CASCADE,
  proveedor TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- Compras
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rfc TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

CREATE TABLE ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  proveedor_id UUID REFERENCES proveedores(id),
  codigo TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'emitida',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orden_compra_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  cantidad NUMERIC(18,4) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE facturas_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  orden_compra_id UUID REFERENCES ordenes_compra(id),
  codigo TEXT NOT NULL,
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  uuid_fiscal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pagos_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id),
  factura_id UUID REFERENCES facturas_proveedor(id),
  monto NUMERIC(18,2) NOT NULL DEFAULT 0,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  cuenta_bancaria_id UUID REFERENCES cuentas_bancarias(id)
);

-- Tesorería
CREATE TABLE movimientos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_bancaria_id UUID NOT NULL REFERENCES cuentas_bancarias(id),
  expediente_id UUID REFERENCES expedientes_negocio(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto NUMERIC(18,2) NOT NULL,
  concepto TEXT,
  cobro_id UUID REFERENCES cobros_cliente(id),
  pago_id UUID REFERENCES pagos_proveedor(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participantes
CREATE TABLE expediente_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  rol TEXT NOT NULL CHECK (rol IN (
    'ejecutivo_comercial', 'lider_proyecto', 'comprador', 'tesoreria', 'direccion'
  )),
  UNIQUE (expediente_id, usuario_id, rol)
);

-- Rentabilidad
CREATE TABLE resumen_financiero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL UNIQUE REFERENCES expedientes_negocio(id) ON DELETE CASCADE,
  monto_vendido NUMERIC(18,2) NOT NULL DEFAULT 0,
  monto_comprado NUMERIC(18,2) NOT NULL DEFAULT 0,
  facturado_cliente NUMERIC(18,2) NOT NULL DEFAULT 0,
  cobrado_cliente NUMERIC(18,2) NOT NULL DEFAULT 0,
  facturado_proveedor NUMERIC(18,2) NOT NULL DEFAULT 0,
  pagado_proveedor NUMERIC(18,2) NOT NULL DEFAULT 0,
  utilidad_bruta NUMERIC(18,2) NOT NULL DEFAULT 0,
  utilidad_neta NUMERIC(18,2) NOT NULL DEFAULT 0,
  margen NUMERIC(5,2) NOT NULL DEFAULT 0,
  roi NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Timeline vivo del expediente
CREATE TABLE expediente_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  entidad_tipo TEXT,
  entidad_id UUID,
  label TEXT NOT NULL,
  sublabel TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  monto NUMERIC(18,2),
  orden INTEGER NOT NULL DEFAULT 0,
  ocurrio_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auditoría
CREATE TABLE auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id),
  entidad_tipo TEXT NOT NULL,
  entidad_id UUID NOT NULL,
  accion TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IA: ingestión de documentos
CREATE TABLE documentos_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresa(id),
  archivo_nombre TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT,
  clasificacion TEXT,
  proveedor TEXT,
  cliente TEXT,
  monto NUMERIC(18,2),
  concepto TEXT,
  proyecto TEXT,
  expediente_sugerido_id UUID REFERENCES expedientes_negocio(id),
  confianza NUMERIC(5,2),
  estado TEXT NOT NULL DEFAULT 'pendiente',
  campos JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insights IA
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID NOT NULL REFERENCES expedientes_negocio(id) ON DELETE CASCADE,
  severidad TEXT NOT NULL DEFAULT 'info',
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  impacto TEXT,
  recomendacion TEXT,
  entidad_relacionada TEXT,
  resuelto BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_expedientes_empresa ON expedientes_negocio(empresa_id);
CREATE INDEX idx_expedientes_cliente ON expedientes_negocio(cliente_id);
CREATE INDEX idx_expedientes_estado ON expedientes_negocio(estado);
CREATE INDEX idx_timeline_expediente ON expediente_timeline(expediente_id, orden);
CREATE INDEX idx_prospectos_empresa ON prospectos(empresa_id);
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_documentos_ia_empresa ON documentos_ia(empresa_id);

-- RLS placeholders (activar al conectar Supabase Auth)
ALTER TABLE expedientes_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_ia ENABLE ROW LEVEL SECURITY;
