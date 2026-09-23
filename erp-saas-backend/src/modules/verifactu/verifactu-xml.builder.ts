import { DOMO_SIF } from './verifactu.constants';

export interface VerifactuDesgloseIva {
  impuesto: string; // '01' IVA
  claveRegimen: string; // '01' régimen general
  calificacionOperacion: string; // S1
  tipoImpositivo: string;
  baseImponibleOimporteNoSujeto: string;
  cuotaRepercutida: string;
}

export interface VerifactuRegistroAltaXmlInput {
  idEmisorFactura: string;
  numSerieFactura: string;
  fechaExpedicionFactura: string;
  tipoFactura: string;
  descripcionOperacion: string;
  cuotaTotal: string;
  importeTotal: string;
  huella: string;
  huellaAnterior: string | null;
  fechaHoraHusoGenRegistro: string;
  nombreRazonEmisor: string;
  desglose: VerifactuDesgloseIva[];
  /** Destinatario (opcional en F2; obligatorio en F1) */
  destinatario?: {
    nif?: string;
    nombreRazon: string;
    codigoPais?: string;
  };
  /** Factura rectificada (tipos R*) */
  facturasRectificadas?: Array<{
    idEmisorFactura: string;
    numSerieFactura: string;
    fechaExpedicionFactura: string;
  }>;
}

export interface VerifactuRegistroAnulacionXmlInput {
  idEmisorFactura: string;
  numSerieFactura: string;
  fechaExpedicionFactura: string;
  huella: string;
  huellaAnterior: string | null;
  fechaHoraHusoGenRegistro: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sistemaInformaticoXml(): string {
  return [
    '<SistemaInformatico>',
    `<NombreRazon>${esc(DOMO_SIF.nombreSistemaInformatico)}</NombreRazon>`,
    `<NIF>${esc(DOMO_SIF.nifProductor)}</NIF>`,
    `<NombreSistemaInformatico>${esc(DOMO_SIF.nombreSistemaInformatico)}</NombreSistemaInformatico>`,
    `<IdSistemaInformatico>${esc(DOMO_SIF.idSistemaInformatico)}</IdSistemaInformatico>`,
    `<Version>${esc(DOMO_SIF.version)}</Version>`,
    `<NumeroInstalacion>${esc(DOMO_SIF.numeroInstalacion)}</NumeroInstalacion>`,
    `<TipoUsoPosibleSoloVerifactu>${DOMO_SIF.tipoUsoPosibleSoloVerifactu}</TipoUsoPosibleSoloVerifactu>`,
    `<TipoUsoPosibleMultiOT>${DOMO_SIF.tipoUsoPosibleMultiOT}</TipoUsoPosibleMultiOT>`,
    `<IndicadorMultiplesOT>${DOMO_SIF.indicadorMultiplesOT}</IndicadorMultiplesOT>`,
    '</SistemaInformatico>',
  ].join('');
}

function encadenamientoXml(huellaAnterior: string | null): string {
  if (!huellaAnterior) {
    return '<Encadenamiento><PrimerRegistro>S</PrimerRegistro></Encadenamiento>';
  }
  return [
    '<Encadenamiento>',
    '<RegistroAnterior>',
    `<Huella>${esc(huellaAnterior)}</Huella>`,
    '</RegistroAnterior>',
    '</Encadenamiento>',
  ].join('');
}

/**
 * Constructor XML mínimo de RegistroAlta / RegistroAnulacion.
 * No valida XSD AEAT todavía; estructura orientativa para desarrollo.
 */
export class VerifactuXmlBuilder {
  buildRegistroAlta(input: VerifactuRegistroAltaXmlInput): string {
    const destinatario = input.destinatario
      ? [
          '<Destinatarios><IDDestinatario>',
          input.destinatario.nif
            ? `<NIF>${esc(input.destinatario.nif)}</NIF>`
            : '',
          `<NombreRazon>${esc(input.destinatario.nombreRazon)}</NombreRazon>`,
          '</IDDestinatario></Destinatarios>',
        ].join('')
      : '';

    const rectificadas = (input.facturasRectificadas ?? [])
      .map(
        (f) =>
          `<IDFacturaRectificada>` +
          `<IDEmisorFactura>${esc(f.idEmisorFactura)}</IDEmisorFactura>` +
          `<NumSerieFactura>${esc(f.numSerieFactura)}</NumSerieFactura>` +
          `<FechaExpedicionFactura>${esc(f.fechaExpedicionFactura)}</FechaExpedicionFactura>` +
          `</IDFacturaRectificada>`,
      )
      .join('');

    const desglose = input.desglose
      .map(
        (d) =>
          `<DetalleDesglose>` +
          `<Impuesto>${esc(d.impuesto)}</Impuesto>` +
          `<ClaveRegimen>${esc(d.claveRegimen)}</ClaveRegimen>` +
          `<CalificacionOperacion>${esc(d.calificacionOperacion)}</CalificacionOperacion>` +
          `<TipoImpositivo>${esc(d.tipoImpositivo)}</TipoImpositivo>` +
          `<BaseImponibleOimporteNoSujeto>${esc(d.baseImponibleOimporteNoSujeto)}</BaseImponibleOimporteNoSujeto>` +
          `<CuotaRepercutida>${esc(d.cuotaRepercutida)}</CuotaRepercutida>` +
          `</DetalleDesglose>`,
      )
      .join('');

    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<RegistroFacturacion>` +
      `<RegistroAlta>` +
      `<IDVersion>1.0</IDVersion>` +
      `<IDFactura>` +
      `<IDEmisorFactura>${esc(input.idEmisorFactura)}</IDEmisorFactura>` +
      `<NumSerieFactura>${esc(input.numSerieFactura)}</NumSerieFactura>` +
      `<FechaExpedicionFactura>${esc(input.fechaExpedicionFactura)}</FechaExpedicionFactura>` +
      `</IDFactura>` +
      `<NombreRazonEmisor>${esc(input.nombreRazonEmisor)}</NombreRazonEmisor>` +
      `<TipoFactura>${esc(input.tipoFactura)}</TipoFactura>` +
      (rectificadas ? `<FacturasRectificadas>${rectificadas}</FacturasRectificadas>` : '') +
      `<DescripcionOperacion>${esc(input.descripcionOperacion)}</DescripcionOperacion>` +
      destinatario +
      `<Desglose>${desglose}</Desglose>` +
      `<CuotaTotal>${esc(input.cuotaTotal)}</CuotaTotal>` +
      `<ImporteTotal>${esc(input.importeTotal)}</ImporteTotal>` +
      encadenamientoXml(input.huellaAnterior) +
      sistemaInformaticoXml() +
      `<FechaHoraHusoGenRegistro>${esc(input.fechaHoraHusoGenRegistro)}</FechaHoraHusoGenRegistro>` +
      `<TipoHuella>01</TipoHuella>` +
      `<Huella>${esc(input.huella)}</Huella>` +
      `</RegistroAlta>` +
      `</RegistroFacturacion>`
    );
  }

  buildRegistroAnulacion(input: VerifactuRegistroAnulacionXmlInput): string {
    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<RegistroFacturacion>` +
      `<RegistroAnulacion>` +
      `<IDVersion>1.0</IDVersion>` +
      `<IDFactura>` +
      `<IDEmisorFactura>${esc(input.idEmisorFactura)}</IDEmisorFactura>` +
      `<NumSerieFactura>${esc(input.numSerieFactura)}</NumSerieFactura>` +
      `<FechaExpedicionFactura>${esc(input.fechaExpedicionFactura)}</FechaExpedicionFactura>` +
      `</IDFactura>` +
      encadenamientoXml(input.huellaAnterior) +
      sistemaInformaticoXml() +
      `<FechaHoraHusoGenRegistro>${esc(input.fechaHoraHusoGenRegistro)}</FechaHoraHusoGenRegistro>` +
      `<TipoHuella>01</TipoHuella>` +
      `<Huella>${esc(input.huella)}</Huella>` +
      `</RegistroAnulacion>` +
      `</RegistroFacturacion>`
    );
  }
}
