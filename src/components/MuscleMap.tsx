import type { MuscleGroupSlot } from '../types';

export interface MuscleMapProps {
  primary: MuscleGroupSlot[];
  secondary?: MuscleGroupSlot[];
  size?: number;
}

function muscleColor(
  slot: MuscleGroupSlot,
  primary: MuscleGroupSlot[],
  secondary: MuscleGroupSlot[] = [],
): string {
  if (primary.includes(slot)) return 'var(--color-accent)';
  if (secondary.includes(slot)) return 'var(--color-protein)';
  return 'var(--color-surface2)';
}

function muscleOpacity(
  slot: MuscleGroupSlot,
  primary: MuscleGroupSlot[],
  secondary: MuscleGroupSlot[] = [],
): number {
  if (primary.includes(slot)) return 0.85;
  if (secondary.includes(slot)) return 0.45;
  return 0.5;
}

export function MuscleMap({ primary, secondary = [], size = 200 }: MuscleMapProps) {
  const mc = (slot: MuscleGroupSlot) => muscleColor(slot, primary, secondary);
  const mo = (slot: MuscleGroupSlot) => muscleOpacity(slot, primary, secondary);

  const surf = 'var(--color-surface)';
  const stroke = 'var(--color-text-muted)';

  return (
    <svg
      viewBox="0 0 200 290"
      width={size}
      height={size * 1.45}
      role="img"
      aria-label="Front and back muscle diagram"
    >
      {/* ─── centre divider ─── */}
      <line
        x1="100" y1="4" x2="100" y2="272"
        stroke="var(--color-surface2)" strokeWidth="1" strokeDasharray="3 4"
      />

      {/* ══════════════════════════════════════════
          FRONT VIEW  (left half, centred x = 50)
      ══════════════════════════════════════════ */}

      {/* Head */}
      <circle cx="50" cy="22" r="14" fill={surf} stroke={stroke} strokeWidth="1.5" />

      {/* Neck */}
      <rect x="46" y="35" width="8" height="9" rx="3"
        fill={surf} stroke={stroke} strokeWidth="1.2" />

      {/* Torso */}
      <rect x="28" y="44" width="44" height="60" rx="8"
        fill={surf} stroke={stroke} strokeWidth="1.5" />

      {/* Shoulder caps — front */}
      <ellipse cx="22" cy="52" rx="10" ry="7"
        fill={mc('shoulders')} opacity={mo('shoulders')} />
      <ellipse cx="78" cy="52" rx="10" ry="7"
        fill={mc('shoulders')} opacity={mo('shoulders')} />

      {/* Pectorals */}
      <ellipse cx="40" cy="57" rx="10" ry="8"
        fill={mc('chest')} opacity={mo('chest')} />
      <ellipse cx="60" cy="57" rx="10" ry="8"
        fill={mc('chest')} opacity={mo('chest')} />

      {/* Abs — 3-row 6-pack */}
      <ellipse cx="44" cy="73" rx="5" ry="4" fill={mc('abs')} opacity={mo('abs')} />
      <ellipse cx="56" cy="73" rx="5" ry="4" fill={mc('abs')} opacity={mo('abs')} />
      <ellipse cx="44" cy="84" rx="5" ry="4" fill={mc('abs')} opacity={mo('abs')} />
      <ellipse cx="56" cy="84" rx="5" ry="4" fill={mc('abs')} opacity={mo('abs')} />
      <ellipse cx="44" cy="95" rx="5" ry="3.5" fill={mc('abs')} opacity={mo('abs')} />
      <ellipse cx="56" cy="95" rx="5" ry="3.5" fill={mc('abs')} opacity={mo('abs')} />

      {/* Upper arms — body structure */}
      <rect x="14" y="48" width="12" height="44" rx="6"
        fill={surf} stroke={stroke} strokeWidth="1.3" />
      <rect x="74" y="48" width="12" height="44" rx="6"
        fill={surf} stroke={stroke} strokeWidth="1.3" />

      {/* Biceps */}
      <ellipse cx="20" cy="67" rx="6" ry="11"
        fill={mc('biceps')} opacity={mo('biceps')} />
      <ellipse cx="80" cy="67" rx="6" ry="11"
        fill={mc('biceps')} opacity={mo('biceps')} />

      {/* Forearms — front */}
      <rect x="13" y="92" width="11" height="30" rx="5"
        fill={mc('forearms')} opacity={mo('forearms')}
        stroke={stroke} strokeWidth="1.2" />
      <rect x="76" y="92" width="11" height="30" rx="5"
        fill={mc('forearms')} opacity={mo('forearms')}
        stroke={stroke} strokeWidth="1.2" />

      {/* Pelvis — front */}
      <rect x="28" y="104" width="44" height="18" rx="7"
        fill={surf} stroke={stroke} strokeWidth="1.5" />

      {/* Quadriceps */}
      <rect x="28" y="120" width="19" height="62" rx="8"
        fill={mc('quads')} opacity={mo('quads')}
        stroke={stroke} strokeWidth="1.2" />
      <rect x="53" y="120" width="19" height="62" rx="8"
        fill={mc('quads')} opacity={mo('quads')}
        stroke={stroke} strokeWidth="1.2" />

      {/* Calves — front */}
      <rect x="30" y="182" width="15" height="58" rx="7"
        fill={mc('calves')} opacity={mo('calves')}
        stroke={stroke} strokeWidth="1.2" />
      <rect x="55" y="182" width="15" height="58" rx="7"
        fill={mc('calves')} opacity={mo('calves')}
        stroke={stroke} strokeWidth="1.2" />

      {/* Feet — front */}
      <rect x="28" y="240" width="19" height="8" rx="4"
        fill={surf} stroke={stroke} strokeWidth="1" />
      <rect x="53" y="240" width="19" height="8" rx="4"
        fill={surf} stroke={stroke} strokeWidth="1" />

      {/* Front label */}
      <text x="50" y="265"
        textAnchor="middle" fontSize="8"
        fill="var(--color-text-muted)"
        fontFamily="Inter, sans-serif"
        letterSpacing="0.4">
        Front
      </text>

      {/* ══════════════════════════════════════════
          BACK VIEW  (right half, centred x = 150)
      ══════════════════════════════════════════ */}

      {/* Head */}
      <circle cx="150" cy="22" r="14" fill={surf} stroke={stroke} strokeWidth="1.5" />

      {/* Neck */}
      <rect x="146" y="35" width="8" height="9" rx="3"
        fill={surf} stroke={stroke} strokeWidth="1.2" />

      {/* Torso */}
      <rect x="128" y="44" width="44" height="60" rx="8"
        fill={surf} stroke={stroke} strokeWidth="1.5" />

      {/* Shoulder caps — rear */}
      <ellipse cx="122" cy="52" rx="10" ry="7"
        fill={mc('shoulders')} opacity={mo('shoulders')} />
      <ellipse cx="178" cy="52" rx="10" ry="7"
        fill={mc('shoulders')} opacity={mo('shoulders')} />

      {/* Trapezius */}
      <ellipse cx="150" cy="53" rx="18" ry="11"
        fill={mc('back')} opacity={mo('back')} />

      {/* Lats */}
      <ellipse cx="136" cy="75" rx="9" ry="14"
        fill={mc('back')} opacity={mo('back')} />
      <ellipse cx="164" cy="75" rx="9" ry="14"
        fill={mc('back')} opacity={mo('back')} />

      {/* Upper arms — body structure (back) */}
      <rect x="114" y="48" width="12" height="44" rx="6"
        fill={surf} stroke={stroke} strokeWidth="1.3" />
      <rect x="174" y="48" width="12" height="44" rx="6"
        fill={surf} stroke={stroke} strokeWidth="1.3" />

      {/* Triceps */}
      <ellipse cx="120" cy="67" rx="6" ry="11"
        fill={mc('triceps')} opacity={mo('triceps')} />
      <ellipse cx="180" cy="67" rx="6" ry="11"
        fill={mc('triceps')} opacity={mo('triceps')} />

      {/* Forearms — back */}
      <rect x="113" y="92" width="11" height="30" rx="5"
        fill={mc('forearms')} opacity={mo('forearms')}
        stroke={stroke} strokeWidth="1.2" />
      <rect x="176" y="92" width="11" height="30" rx="5"
        fill={mc('forearms')} opacity={mo('forearms')}
        stroke={stroke} strokeWidth="1.2" />

      {/* Pelvis — back (subtle base for glute overlay) */}
      <rect x="128" y="104" width="44" height="18" rx="7"
        fill={surf} stroke={stroke} strokeWidth="1.5" />

      {/* Glutes */}
      <ellipse cx="141" cy="113" rx="14" ry="13"
        fill={mc('glutes')} opacity={mo('glutes')} />
      <ellipse cx="159" cy="113" rx="14" ry="13"
        fill={mc('glutes')} opacity={mo('glutes')} />

      {/* Hamstrings */}
      <rect x="128" y="120" width="19" height="62" rx="8"
        fill={mc('hamstrings')} opacity={mo('hamstrings')}
        stroke={stroke} strokeWidth="1.2" />
      <rect x="153" y="120" width="19" height="62" rx="8"
        fill={mc('hamstrings')} opacity={mo('hamstrings')}
        stroke={stroke} strokeWidth="1.2" />

      {/* Calves — back */}
      <rect x="130" y="182" width="15" height="58" rx="7"
        fill={mc('calves')} opacity={mo('calves')}
        stroke={stroke} strokeWidth="1.2" />
      <rect x="155" y="182" width="15" height="58" rx="7"
        fill={mc('calves')} opacity={mo('calves')}
        stroke={stroke} strokeWidth="1.2" />

      {/* Feet — back */}
      <rect x="128" y="240" width="19" height="8" rx="4"
        fill={surf} stroke={stroke} strokeWidth="1" />
      <rect x="153" y="240" width="19" height="8" rx="4"
        fill={surf} stroke={stroke} strokeWidth="1" />

      {/* Back label */}
      <text x="150" y="265"
        textAnchor="middle" fontSize="8"
        fill="var(--color-text-muted)"
        fontFamily="Inter, sans-serif"
        letterSpacing="0.4">
        Back
      </text>
    </svg>
  );
}
