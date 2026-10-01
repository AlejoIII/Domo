import type { SVGProps } from 'react';
import markSrc from '@/assets/brand/domo-mark.png';
import stackedSrc from '@/assets/brand/domo-logo-stacked.png';

const wordmarkProps = {
  fill: '#0B5E47',
  fontFamily: 'Segoe UI, system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif',
  fontWeight: 700,
} as const;

type LogoSvgProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/** Barra horizontal: símbolo (raster nítido) + DOMO vectorial */
export function DomoLogoHorizontalSvg({ className, title = 'Domo', ...props }: LogoSvgProps) {
  const labelled = props['aria-hidden'] ? {} : { role: 'img' as const, 'aria-label': title };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 208 48"
      fill="none"
      className={className}
      {...labelled}
      {...props}
    >
      {!props['aria-hidden'] && <title>{title}</title>}
      <image href={markSrc} x="0" y="2" width="44" height="44" preserveAspectRatio="xMidYMid meet" />
      <text
        x="52"
        y="32"
        {...wordmarkProps}
        fontSize={24}
        letterSpacing="0.14em"
      >
        DOMO
      </text>
    </svg>
  );
}

export function DomoMarkSvg({ className, title = 'Domo', ...props }: LogoSvgProps) {
  const labelled = props['aria-hidden'] ? {} : { role: 'img' as const, 'aria-label': title };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      {...labelled}
      {...props}
    >
      {!props['aria-hidden'] && <title>{title}</title>}
      <image href={markSrc} x="0" y="0" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

/** Login/registro: composición vertical (SVG contenedor + raster oficial) */
export function DomoLogoStackedSvg({ className, title = 'Domo', ...props }: LogoSvgProps) {
  const labelled = props['aria-hidden'] ? {} : { role: 'img' as const, 'aria-label': title };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 220"
      fill="none"
      className={className}
      {...labelled}
      {...props}
    >
      {!props['aria-hidden'] && <title>{title}</title>}
      <image
        href={stackedSrc}
        x="0"
        y="0"
        width="200"
        height="220"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
