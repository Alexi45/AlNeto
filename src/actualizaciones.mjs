// Historial público de cambios en las cifras y las calculadoras (lo más reciente arriba).
export const ACTUALIZACIONES = [
  {
    fecha: '2026-10-20',
    titulo: 'Metodología, comprobaciones y gráficos',
    detalle: 'Nueva página de metodología con los casos de control que se comprueban en cada actualización. Gráficos interactivos en la hipoteca y en las páginas de sueldo, buscador y modo oscuro.',
  },
  {
    fecha: '2026-10-13',
    titulo: 'Hipoteca, autónomos y 59 páginas de sueldo',
    detalle: 'Calculadora de hipoteca con el Euríbor de septiembre (3,247 %) y el tipo medio fijo del INE; cuota de autónomos 2026 con la tabla de la Orden PJC/297/2026; comparativa salarial con la Encuesta de Estructura Salarial 2024.',
  },
  {
    fecha: '2026-10-08',
    titulo: 'Lanzamiento con las cifras de 2026',
    detalle: 'Sueldo neto con el algoritmo de retenciones de 2026, finiquito, paro con el IPREM de 2026 y previsión de las pensiones de 2027 con el IPC adelantado de septiembre (4,9 %).',
  },
];

// Próximas revisiones previstas (fechas aproximadas de publicación de cada dato)
export const PROXIMAS = [
  { fecha: '2026-10-30', dato: 'IPC adelantado de octubre (INE)', afecta: 'Pensiones 2027' },
  { fecha: '2026-11-02', dato: 'Euríbor medio de octubre (Banco de España)', afecta: 'Hipoteca' },
  { fecha: '2026-11-27', dato: 'IPC adelantado de noviembre (INE)', afecta: 'Pensiones 2027: subida casi definitiva' },
  { fecha: '2026-12-15', dato: 'Revalorización oficial de las pensiones', afecta: 'Pensiones 2027' },
  { fecha: '2027-01-15', dato: 'Bases y tipos de cotización de 2027', afecta: 'Sueldo neto, autónomos, paro' },
];
