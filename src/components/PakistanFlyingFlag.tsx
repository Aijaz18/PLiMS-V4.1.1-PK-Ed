import React from 'react';

interface PakistanFlyingFlagProps {
  /** Size variant: 'xs' (compact header), 'sm' (header badge), 'md' (standard), 'lg' (showcase) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to render the metallic flagpole and golden finial */
  showMast?: boolean;
  /** Whether to show a waving badge container */
  asBadge?: boolean;
  /** Custom extra styling */
  className?: string;
  /** Optional subtitle or title */
  title?: string;
}

export const PakistanFlyingFlag: React.FC<PakistanFlyingFlagProps> = ({
  size = 'md',
  showMast = true,
  asBadge = false,
  className = '',
  title = 'Islamic Republic of Pakistan • National Flag'
}) => {
  // Dimensions based on size
  const config = {
    xs: { flagW: 27, flagH: 18, poleH: 26, poleW: 2.5, finialR: 2.5 },
    sm: { flagW: 36, flagH: 24, poleH: 34, poleW: 3, finialR: 3 },
    md: { flagW: 51, flagH: 34, poleH: 48, poleW: 3.5, finialR: 3.5 },
    lg: { flagW: 72, flagH: 48, poleH: 68, poleW: 4.5, finialR: 4.5 },
    xl: { flagW: 96, flagH: 64, poleH: 90, poleW: 5, finialR: 5.5 }
  }[size];

  // SVG representation of official Flag of Pakistan (ratio 3:2)
  // viewBox: 0 0 300 200
  // White stripe: x=0, y=0, width=75, height=200
  // Pakistan Green field: x=75, y=0, width=225, height=200 (#01411C)
  // Crescent and Star:
  // Center of green field is at x = 75 + 112.5 = 187.5, y = 100
  // Rotation along diagonal towards top-right (around 31.6 degrees or ~32 degrees)
  const FlagSvg = (
    <div
      className="relative rounded-sm overflow-hidden shadow-md animate-flag-flutter"
      style={{
        width: config.flagW,
        height: config.flagH,
        transformOrigin: 'left center'
      }}
      title={title}
    >
      <svg
        viewBox="0 0 300 200"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle cloth texture gradient */}
          <linearGradient id="pakGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#024921" />
            <stop offset="50%" stopColor="#01411C" />
            <stop offset="100%" stopColor="#003516" />
          </linearGradient>
          {/* White cloth gradient */}
          <linearGradient id="pakWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>

        {/* 1. White vertical stripe on hoist (1/4th = 75 of 300) */}
        <rect x="0" y="0" width="75" height="200" fill="url(#pakWhiteGrad)" />

        {/* 2. Official Dark Green Field (3/4th = 225 of 300) */}
        <rect x="75" y="0" width="225" height="200" fill="url(#pakGreenGrad)" />

        {/* 3. Official Crescent & 5-Pointed Star tilted towards top-right fly corner */}
        <g transform="translate(187.5, 100) rotate(-35)">
          {/* Crescent Moon: Outer circle R=60, Inner circle R=54 shifted right by 11 */}
          <path
            d="
              M 0 -60
              A 60 60 0 1 0 0 60
              A 54 54 0 1 1 12 -53
              Z
            "
            fill="#ffffff"
          />

          {/* 5-pointed Star pointing directly towards the crescent opening / top-right */}
          <g transform="translate(24, -20) rotate(18)">
            <polygon
              points="
                0,-24
                7.4,-7.4
                24,-7.4
                10.5,2.8
                15.7,19.4
                0,8.8
                -15.7,19.4
                -10.5,2.8
                -24,-7.4
                -7.4,-7.4
              "
              fill="#ffffff"
            />
          </g>
        </g>
      </svg>

      {/* Dynamic 3D Wind Sheen & Shadow Overlay moving across the flying cloth */}
      <div className="absolute inset-0 flag-sheen-overlay" />

      {/* Fly-edge flapping shadow */}
      <div className="absolute top-0 right-0 bottom-0 w-2 pointer-events-none bg-gradient-to-l from-black/20 to-transparent" />
    </div>
  );

  if (!showMast) {
    if (asBadge) {
      return (
        <div
          className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 shadow-sm backdrop-blur-xs ${className}`}
        >
          {FlagSvg}
          <span className="text-xs font-semibold tracking-wide text-white">Pakistan</span>
        </div>
      );
    }
    return <div className={`inline-block ${className}`}>{FlagSvg}</div>;
  }

  // With Flagpole & Golden Finial
  return (
    <div
      className={`inline-flex items-start select-none ${className}`}
      title={title}
    >
      {/* Flagpole & Finial */}
      <div
        className="flex flex-col items-center shrink-0 mr-[-1px] z-10"
        style={{ height: config.poleH }}
      >
        {/* Golden Spear/Sphere Finial at top */}
        <div
          className="rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-100 shadow-xs ring-1 ring-amber-400/80 shrink-0"
          style={{
            width: config.finialR * 2,
            height: config.finialR * 2,
            marginBottom: -1
          }}
        />

        {/* Pole Base Collar */}
        <div
          className="w-1.5 h-0.5 bg-amber-400/90 rounded-xs mb-0.5"
        />

        {/* Silver/Metallic Brushed Pole */}
        <div
          className="flex-1 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 shadow-xs rounded-full relative"
          style={{ width: config.poleW }}
        >
          {/* Top Halyard Cord Clip */}
          <div
            className="absolute top-1 -right-0.5 w-1 h-1 bg-amber-400 rounded-full shadow-2xs"
          />
          {/* Bottom Halyard Cord Clip */}
          <div
            className="absolute -right-0.5 w-1 h-1 bg-amber-400 rounded-full shadow-2xs"
            style={{ top: config.flagH - 2 }}
          />
        </div>

        {/* Pole Base Stand / Pedestal */}
        <div
          className="h-1 rounded-full bg-gradient-to-t from-slate-600 to-slate-400 shadow-xs"
          style={{ width: config.poleW * 2.5 }}
        />
      </div>

      {/* Flying Cloth hoisted at top of mast */}
      <div className="pt-1.5">
        {FlagSvg}
      </div>
    </div>
  );
};
