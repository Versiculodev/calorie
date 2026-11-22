import Svg, { ClipPath, Defs, Ellipse, Path, Rect } from "react-native-svg";

import { palette } from "@/theme/palette";

const BODY = "M16 50 C22 112 48 120 84 120 C120 120 146 112 152 50";

interface BowlProps {
  portion: number;
  over: boolean;
}

export function Bowl({ portion, over }: BowlProps) {
  const clamped = Math.min(1, Math.max(0, portion));
  // A few calories would otherwise sit as a hairline. Lift the first bite so the bowl reads as partly full.
  const amount = over ? 1 : clamped <= 0 ? 0 : 0.16 + clamped * 0.84;
  const level = 120 - amount * 70;
  const liquid = over ? palette.cinnabar : palette.broth;
  const surface = amount > 0.92 ? liquid : palette.slip;

  return (
    <Svg width={148} height={118} viewBox="0 0 168 132">
      <Path
        d={BODY}
        fill={palette.slip}
        stroke={palette.glaze}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={10}
      />
      {amount > 0 ? (
        <>
          <Defs>
            <ClipPath id="bowl-well">
              <Path d={BODY} />
            </ClipPath>
          </Defs>
          <Rect x={0} y={level} width={168} height={140} fill={liquid} clipPath="url(#bowl-well)" />
        </>
      ) : null}
      <Ellipse
        cx={84}
        cy={50}
        rx={66}
        ry={10}
        fill={surface}
        stroke={palette.glaze}
        strokeWidth={6}
      />
    </Svg>
  );
}
