// Parámetros oficiales para 2026. Cada bloque indica su norma de origen.
// Cuando cambie algo (nuevo año, nuevo IPC...) se toca SOLO este archivo.

export const ACTUALIZADO = '2026-10-08';

export const SS = {
  // Orden de cotización 2026 (Orden PJC/297/2026)
  baseMaxMensual: 5101.2,
  trabajador: {
    contingenciasComunes: 0.047,
    desempleoIndefinido: 0.0155,
    desempleoTemporal: 0.016,
    formacion: 0.001,
    mei: 0.0015, // Mecanismo de Equidad Intergeneracional: 0,90 % total, 0,15 % trabajador
  },
  // Cotización adicional de solidaridad (RDL 2/2023, tipos 2026): parte del trabajador
  // sobre lo que exceda de la base máxima, por tramos mensuales.
  solidaridad: [
    { desde: 5101.2, hasta: 5611.32, tipo: 0.0019 },
    { desde: 5611.32, hasta: 7651.8, tipo: 0.0021 },
    { desde: 7651.8, hasta: Infinity, tipo: 0.0024 },
  ],
};

export const IRPF = {
  // Reglamento del IRPF (arts. 80-88) y algoritmo de retenciones de la AEAT 2026
  otrosGastos: 2000,
  // Reducción por obtención de rendimientos del trabajo (art. 20 LIRPF)
  reduccionTrabajo: { maximo: 7302, tramo1: 14852, tramo2: 17673.52, tramo3: 19747.5, base2: 2364.34 },
  escala: [
    { hasta: 12450, tipo: 0.19 },
    { hasta: 20200, tipo: 0.24 },
    { hasta: 35200, tipo: 0.3 },
    { hasta: 60000, tipo: 0.37 },
    { hasta: 300000, tipo: 0.45 },
    { hasta: Infinity, tipo: 0.47 },
  ],
  minimoContribuyente: 5550,
  incrementoMayor65: 1150,
  incrementoMayor75: 1400,
  minimoDescendientes: [2400, 2700, 4000, 4500],
  incrementoMenor3: 2800,
  // Límite excluyente de retención (RD 142/2024). Índice = nº de hijos (0, 1, 2 o más).
  // Situación 1: monoparental · 2: cónyuge con rentas < 1.500 € · 3: resto
  limiteExcluyente: {
    1: [null, 17644, 18694],
    2: [17197, 18130, 19262],
    3: [15876, 16342, 16867],
  },
  limite43: { porcentaje: 0.43, hastaRetribucion: 35200 },
  tipoMinimoTemporal: 0.02,
  // Deducción en la Renta para sueldos bajos (DA 61.ª LIRPF, RDL 5/2026)
  deduccionSMI: { maximo: 590.89, desde: 17094, pendiente: 0.2, limite: 20048.45 },
};

export const SMI = { mensual14: 1221, anual: 17094 }; // RD 126/2026

export const PARO = {
  iprem: 600, // IPREM mensual 2026 (sin cambios desde 2023)
  porcentajes: { hasta180: 0.7, desde181: 0.6 },
  // Topes sobre el IPREM incrementado en 1/6 (prorrata de pagas)
  minimo: { sinHijos: 0.8, conHijos: 1.07 },
  maximo: { sinHijos: 1.75, unHijo: 2.0, dosOMas: 2.25 },
  cotizacionTrabajador: 0.047, // se descuenta sobre la base reguladora
  // [días cotizados en los últimos 6 años, días de prestación]
  duracion: [
    [360, 120], [540, 180], [720, 240], [900, 300], [1080, 360], [1260, 420],
    [1440, 480], [1620, 540], [1800, 600], [1980, 660], [2160, 720],
  ],
};

export const PENSIONES = {
  revalorizacion2026: 0.027,
  maxima2026: 3359.6, // mensual, 14 pagas (RD 39/2026)
  incrementoExtraMaxima: 0.00115, // la pensión máxima sube 0,115 puntos más cada año
  // Media de las tasas interanuales del IPC de diciembre 2025 a septiembre 2026 (INE)
  ipc: { mediaProvisional: 0.0333, mesesConocidos: 10, ultimoDato: 0.049, ultimoMes: 'septiembre de 2026' },
  estimacion2027: 0.035,
};
