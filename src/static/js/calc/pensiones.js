import { PENSIONES } from './params-2026.js';
import { redondear } from './util.js';

export const pensionMaxima2027 = (subida) =>
  redondear(PENSIONES.maxima2026 * (1 + subida + PENSIONES.incrementoExtraMaxima));

// Subida resultante (redondeada a un decimal, como la oficial) si el IPC interanual
// de los meses que faltan hasta noviembre se queda en `ipcResto`.
export const subidaPrevista = (ipcResto) => {
  const { mediaProvisional, mesesConocidos } = PENSIONES.ipc;
  const media = (mediaProvisional * mesesConocidos + ipcResto * (12 - mesesConocidos)) / 12;
  return redondear(media, 3);
};

export function calcularPension({ pensionMensual, pagas = 14, subida = PENSIONES.estimacion2027 }) {
  // Sobre los importes en 14 pagas, que es como fija la Seguridad Social la pensión máxima.
  const mensual14 = pagas === 12 ? pensionMensual * 12 / 14 : pensionMensual;
  const enMaxima = mensual14 >= PENSIONES.maxima2026 - 0.005;
  const maxima2027 = pensionMaxima2027(subida);
  const nueva14 = enMaxima ? maxima2027 : redondear(mensual14 * (1 + subida));
  const factor = pagas === 12 ? 14 / 12 : 1;
  const nueva = redondear(nueva14 * factor);
  const anualActual = redondear(mensual14 * 14);
  const anualNueva = redondear(nueva14 * 14);

  return {
    subida,
    pagas,
    actual: redondear(pensionMensual),
    nueva,
    subidaPorPaga: redondear(nueva - pensionMensual),
    anualActual,
    anualNueva,
    subidaAnual: redondear(anualNueva - anualActual),
    enMaxima,
    porEncimaDeMaxima: mensual14 > PENSIONES.maxima2026 + 0.005,
    maxima2027,
  };
}
