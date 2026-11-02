import type { SVGProps } from 'react';

export interface BeachUmbrellaProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export default function BeachUmbrella({ size = 24, className, ...props }: BeachUmbrellaProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Finial tip */}
      <path d="M12 2v1" />
      {/* Beach umbrella canopy dome */}
      <path d="M3 12a9 9 0 0 1 18 0" />
      {/* Scalloped beach parasol edge */}
      <path d="M3 12c1.5-1.4 4.5-1.4 6 0 1.5-1.4 4.5-1.4 6 0 1.5-1.4 4.5-1.4 6 0" />
      {/* Parasol ribs */}
      <path d="M12 3c-1.8 2.6-2.8 5.6-3 9" />
      <path d="M12 3c1.8 2.6 2.8 5.6 3 9" />
      {/* Pole */}
      <path d="M12 11.2V19" />
      {/* Sea wave / beach base */}
      <path d="M4 20.5c1.6-1.3 3.4-1.3 5 0s3.4 1.3 5 0 3.4-1.3 6 0" />
    </svg>
  );
}
