/**
 * Soft KiroAvatar — official body + eye glyphs unchanged.
 * Accessories use rounded caps and soft ink (#2A1F3D), pastel tiles,
 * gentle body shading and a ground shadow.
 */
(function (root, factory) {
  const renderer = factory();
  if (typeof module === "object" && module.exports) module.exports = renderer;
  // Vite's production bundle wraps this UMD file as CommonJS. The React
  // adapter and standalone design previews both consume the browser global.
  if (root) root.KiroAvatar = renderer;
})(typeof self !== "undefined" ? self : this, function () {
  const WHITE = "#ffffff";
  const EYE_INK = "#000000"; // official face ink — do not soften the mark
  const INK = "#2A1F3D"; // soft dark-purple for accessories / outlines
  const BLUSH = "#FFB7C8";
  const BRAND_PURPLE = "#A57BFF";

  const BODY =
    "M398.554 818.914C316.315 1001.03 491.477 1046.74 620.672 940.156C658.687 1059.66 801.052 970.473 852.234 877.795C964.787 673.567 919.318 465.357 907.64 422.374C827.637 129.443 427.623 128.946 358.8 423.865C342.651 475.544 342.402 534.18 333.458 595.051C328.986 625.86 325.507 645.488 313.83 677.785C306.873 696.424 297.68 712.819 282.773 740.645C259.915 783.881 269.604 867.113 387.87 823.883L399.051 818.914H398.554Z";

  const EYE_A =
    "M636.123 549.353C603.328 549.353 598.359 510.097 598.359 486.742C598.359 465.623 602.086 448.977 609.293 438.293C615.504 428.852 624.697 424.131 636.123 424.131C647.555 424.131 657.492 428.852 664.447 438.541C672.398 449.474 676.623 466.12 676.623 486.742C676.623 525.998 661.471 549.353 636.375 549.353H636.123Z";

  const EYE_B =
    "M771.24 549.353C738.445 549.353 733.477 510.097 733.477 486.742C733.477 465.623 737.203 448.977 744.41 438.293C750.621 428.852 759.814 424.131 771.24 424.131C782.672 424.131 792.609 428.852 799.564 438.541C807.516 449.474 811.74 466.12 811.74 486.742C811.74 525.998 796.588 549.353 771.492 549.353H771.24Z";

  const EL = 637.5;
  const ER = 772.6;
  const EY = 486.7;
  const CANON = `<path d="${EYE_A}" fill="${EYE_INK}"/><path d="${EYE_B}" fill="${EYE_INK}"/>`;
  const pair = (fn) => [EL, ER].map(fn).join("");
  const lid = (x, dip) =>
    `<path d="M${x - 44} ${EY + (dip > 0 ? -20 : 26)}q44 ${dip} 88 0" stroke="${EYE_INK}" stroke-width="30" fill="none" stroke-linecap="round"/>`;
  const STAR_D = "l11 24 24 11-24 11-11 24-11-24-24-11 24-11z";
  const star = (x) => `<path d="M${x + 12} ${EY - 46}${STAR_D}" fill="${WHITE}"/>`;
  const heartEye = (x) =>
    `<path d="M${x} ${EY + 44}C${x - 60} ${EY} ${x - 42} ${EY - 48} ${x} ${EY - 18}C${x + 42} ${EY - 48} ${x + 60} ${EY} ${x} ${EY + 44}Z" fill="${EYE_INK}"/>`;

  const EYES = {
    canon: CANON,
    closed: pair((x) => lid(x, -52)),
    sleepy: pair((x) => lid(x, 52)),
    wink: `<path d="${EYE_A}" fill="${EYE_INK}"/>${lid(ER, -52)}`,
    wide:
      pair((x) => `<circle cx="${x}" cy="${EY}" r="54" fill="${EYE_INK}"/>`) +
      pair((x) => `<circle cx="${x + 17}" cy="${EY - 20}" r="16" fill="${WHITE}"/>`),
    sparkle: CANON + pair(star),
    visor:
      `<rect x="${EL - 52}" y="${EY - 50}" width="${ER - EL + 104}" height="100" rx="50" fill="${EYE_INK}"/>` +
      `<rect x="${EL - 22}" y="${EY - 26}" width="34" height="20" rx="10" fill="${WHITE}" opacity="0.85"/>`,
    glasses:
      CANON +
      pair((x) => `<circle cx="${x}" cy="${EY}" r="66" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`) +
      `<path d="M${EL + 66} ${EY}L${ER - 66} ${EY}" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>` +
      `<path d="M${EL - 66} ${EY - 10}l-46-26" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>`,
    cross:
      `<path d="M${EL - 38} ${EY - 34}l76 34-76 34z" fill="${EYE_INK}"/>` +
      `<path d="M${ER + 38} ${EY - 34}l-76 34 76 34z" fill="${EYE_INK}"/>`,
    squint: pair((x) => `<rect x="${x - 42}" y="${EY - 14}" width="84" height="28" rx="14" fill="${EYE_INK}"/>`),
    swirl:
      pair((x) => `<circle cx="${x}" cy="${EY}" r="46" fill="none" stroke="${EYE_INK}" stroke-width="20" stroke-linecap="round"/>`) +
      pair((x) => `<circle cx="${x}" cy="${EY}" r="10" fill="${EYE_INK}"/>`),
    heart: pair(heartEye),
    cyclops:
      `<ellipse cx="${(EL + ER) / 2}" cy="${EY}" rx="66" ry="84" fill="${EYE_INK}"/>` +
      `<circle cx="${(EL + ER) / 2 + 22}" cy="${EY - 28}" r="20" fill="${WHITE}"/>`,
  };

  const BROWS = {
    none: "",
    raised: pair((x) => `<path d="M${x - 40} 402q40-34 80 0" stroke="${EYE_INK}" stroke-width="20" fill="none" stroke-linecap="round"/>`),
    angry:
      `<path d="M${EL - 42} 380l84 30" stroke="${EYE_INK}" stroke-width="22" stroke-linecap="round"/>` +
      `<path d="M${ER + 42} 380l-84 30" stroke="${EYE_INK}" stroke-width="22" stroke-linecap="round"/>`,
    flat: pair((x) => `<path d="M${x - 40} 396h80" stroke="${EYE_INK}" stroke-width="20" stroke-linecap="round"/>`),
  };

  const MOUTHS = {
    none: "",
    smile: `<path d="M660 622q45 42 90 0" stroke="${EYE_INK}" stroke-width="26" fill="none" stroke-linecap="round"/>`,
    open: `<path class="kiro-yawn-mouth" d="M662 612q43 78 86 0Z" fill="${EYE_INK}"/>`,
    cat: `<path d="M662 612q22 30 43 0q22 30 43 0" stroke="${EYE_INK}" stroke-width="24" fill="none" stroke-linecap="round"/>`,
    oh: `<ellipse cx="705" cy="628" rx="30" ry="38" fill="${EYE_INK}"/>`,
    grin:
      `<path d="M652 606q53 82 106 0Z" fill="${EYE_INK}"/>` +
      `<path d="M660 618h90" stroke="${WHITE}" stroke-width="18" stroke-linecap="round"/>`,
    tongue:
      `<path d="M662 606q43 78 86 0Z" fill="${EYE_INK}"/>` +
      `<path d="M688 648q17 34 34 0Z" fill="${BLUSH}"/>`,
    wobble:
      `<path d="M660 620l22 18 22-18 22 18 22-18" stroke="${EYE_INK}" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    smirk: `<path d="M666 626q52 30 78-16" stroke="${EYE_INK}" stroke-width="24" fill="none" stroke-linecap="round"/>`,
  };

  const ACCESSORIES = {
    none: "",
    antenna:
      `<path d="M628 250V120" stroke="${WHITE}" stroke-width="36" stroke-linecap="round"/>` +
      `<circle cx="628" cy="104" r="48" fill="${WHITE}"/>`,
    halo: `<ellipse cx="632" cy="150" rx="200" ry="56" fill="none" stroke="#F6E7A2" stroke-width="28" stroke-linecap="round"/>`,
    cap:
      `<path d="M380 330a262 262 0 0 1 500 24l-8 26q-244-96-492-50Z" fill="${INK}"/>` +
      `<path d="M872 380q130 8 158 58q-110 20-166-32Z" fill="${INK}"/>`,
    phones:
      `<path d="M352 470V392a288 262 0 0 1 556 30" fill="none" stroke="${INK}" stroke-width="36" stroke-linecap="round"/>` +
      `<rect x="292" y="436" width="120" height="184" rx="60" fill="${INK}"/>` +
      `<rect x="852" y="436" width="120" height="184" rx="60" fill="${INK}"/>`,
    bow:
      `<path d="M436 300l-100-52q8 52 0 104Z" fill="#F0A0B8"/>` +
      `<path d="M436 300l100-52q-8 52 0 104Z" fill="#F0A0B8"/>` +
      `<circle cx="436" cy="300" r="32" fill="#E890AC"/>`,
    crown:
      `<path d="M478 318c-4-40 0-96 0-110c28 28 52 58 70 58c16 0 36-40 62-82c26 42 46 82 62 82c18 0 42-30 70-58c0 14 4 70 0 110Z" fill="#F6D56A"/>` +
      `<circle cx="548" cy="268" r="14" fill="#FFE9A8"/>` +
      `<circle cx="704" cy="220" r="16" fill="#FFE9A8"/>` +
      `<circle cx="858" cy="268" r="14" fill="#FFE9A8"/>`,
    beanie:
      `<path d="M396 336a244 244 0 0 1 456 10Z" fill="${INK}"/>` +
      `<rect x="388" y="328" width="470" height="58" rx="26" fill="${INK}"/>` +
      `<circle cx="624" cy="160" r="52" fill="#F7F2FF"/>` +
      `<path d="M624 210v-50" stroke="#F7F2FF" stroke-width="18" stroke-linecap="round"/>`,
    party:
      `<path d="M624 130l108 200H516Z" fill="#B089F7"/>` +
      `<circle cx="624" cy="118" r="38" fill="#F6D56A"/>`,
    flower: (function () {
      return (
        [0, 72, 144, 216, 288]
          .map((a) => {
            const r = (a * Math.PI) / 180;
            const cx = (470 + Math.cos(r) * 44).toFixed(1);
            const cy = (300 + Math.sin(r) * 44).toFixed(1);
            return `<circle cx="${cx}" cy="${cy}" r="32" fill="#F0A0B8"/>`;
          })
          .join("") + `<circle cx="470" cy="300" r="24" fill="#F6E7A2"/>`
      );
    })(),
    bandana:
      `<path d="M392 342q230-96 470-22l-14 66q-232-70-448 22Z" fill="#E8928A"/>` +
      `<path d="M392 342l-108 36 60 36Z" fill="#E8928A"/>`,
    hardhat:
      `<path d="M400 340a228 220 0 0 1 448 10Z" fill="#FFE08A"/>` +
      `<rect x="348" y="344" width="552" height="56" rx="28" fill="#F3D16A"/>` +
      `<path d="M624 340V208" stroke="#FFF6D6" stroke-width="28" stroke-linecap="round"/>`,
  };

  const PROP_SCALE = 2.85;
  const PROP_AT = [764, 726];
  const prop = (d) => `<g transform="translate(${PROP_AT[0]},${PROP_AT[1]}) scale(${PROP_SCALE})">${d}</g>`;

  const PROPS = {
    none: "",
    mug: prop(
      `<rect x="0" y="44" width="80" height="72" rx="22" fill="${INK}"/>` +
        `<path d="M80 66h20a20 20 0 0 1 0 40H80" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>` +
        `<path d="M18 26q10-20 20 0" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>` +
        `<path d="M50 26q10-20 20 0" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>`
    ),
    glass: prop(
      `<circle cx="46" cy="52" r="40" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>` +
        `<path d="M76 82l34 34" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`
    ),
    wrench: prop(
      `<path d="M16 10l30 30-18 18L-6 30A32 32 0 0 1 16 10Z" fill="${INK}"/>` +
        `<path d="M34 56l64 64" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>`
    ),
    bolt: prop(`<path d="M64 0L8 88h36L26 164 94 68H54Z" fill="#F6D56A"/>`),
    star: prop(
      `<path d="M56 6l16 36 40 4-30 28 8 40-34-20-34 20 8-40-30-28 40-4Z" fill="#F6D56A"/>`
    ),
    term: prop(
      `<rect x="0" y="12" width="112" height="86" rx="18" fill="none" stroke="${INK}" stroke-width="12"/>` +
        `<path d="M22 44l16 13-16 13" stroke="${INK}" stroke-width="10" fill="none" stroke-linecap="round"/>` +
        `<path d="M50 70h30" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>`
    ),
    heart: prop(`<path d="M56 104C-8 60 14 6 56 34C98 6 120 60 56 104Z" fill="#F0A0B8"/>`),
  };

  function customs(uid, list) {
    const out = [];
    for (const name of list || []) {
      if (name === "raincoat") {
        out.push(`
          <g class="kiro-custom kiro-raincoat">
            <g clip-path="url(#${uid}-bodyclip)">
              <path d="M250 600C430 470 700 460 940 540V1020H250Z" fill="#F8D98A"/>
              <path d="M618 548V920" stroke="#C9A86A" stroke-width="10" stroke-linecap="round" opacity="0.45"/>
              <circle cx="618" cy="630" r="12" fill="#C9A86A"/>
              <circle cx="618" cy="710" r="12" fill="#C9A86A"/>
              <circle cx="618" cy="790" r="12" fill="#C9A86A"/>
            </g>
            <path d="M448 500C530 572 820 568 912 492C800 600 530 608 448 500Z" fill="#F0C878"/>
            <path d="M430 268C560 150 820 168 900 300C780 230 560 220 430 268Z" fill="#F8D98A"/>
          </g>`);
      } else if (name === "umbrella") {
        out.push(`
          <g class="kiro-custom kiro-umbrella">
            <path d="M300 760L250 440" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
            <path d="M300 760q16 26-8 38" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
            <path d="M70 450Q248 210 440 450Q248 520 70 450Z" fill="#6BA3C9"/>
            <path d="M248 250v36" stroke="#F6D56A" stroke-width="14" stroke-linecap="round"/>
          </g>`);
      } else if (name === "mask") {
        out.push(`
          <g class="kiro-custom kiro-mask">
            <path d="M575 575Q470 600 455 690" fill="none" stroke="#D5CBDA" stroke-width="14" stroke-linecap="round"/>
            <path d="M830 568Q948 595 958 690" fill="none" stroke="#D5CBDA" stroke-width="14" stroke-linecap="round"/>
            <ellipse cx="705" cy="648" rx="140" ry="96" fill="#F7F4FA" stroke="#C8B8D0" stroke-width="8"/>
            <path d="M590 628Q705 648 820 622" fill="none" stroke="#D5CBDA" stroke-width="7" stroke-linecap="round"/>
            <path d="M592 662Q705 684 822 656" fill="none" stroke="#D5CBDA" stroke-width="7" stroke-linecap="round"/>
          </g>`);
      } else if (name === "zzz") {
        out.push(`
          <g class="kiro-custom kiro-zzz" font-family="Georgia, serif" font-weight="700" fill="#D4C4F0">
            <text class="z1" x="860" y="280" font-size="70">Z</text>
            <text class="z2" x="920" y="210" font-size="90">Z</text>
            <text class="z3" x="990" y="140" font-size="112">Z</text>
          </g>`);
      } else if (name === "rain") {
        out.push(`
          <g class="kiro-custom kiro-rain-drops" stroke="#C5DFF0" stroke-linecap="round">
            <line class="drop d1" x1="360" y1="80" x2="348" y2="130" stroke-width="10"/>
            <line class="drop d2" x1="520" y1="40" x2="508" y2="100" stroke-width="8"/>
            <line class="drop d3" x1="700" y1="60" x2="686" y2="120" stroke-width="10"/>
            <line class="drop d4" x1="880" y1="30" x2="866" y2="96" stroke-width="8"/>
            <line class="drop d5" x1="980" y1="90" x2="966" y2="150" stroke-width="9"/>
            <line class="drop d6" x1="200" y1="50" x2="186" y2="110" stroke-width="8"/>
          </g>`);
      } else if (name === "dust") {
        out.push(`
          <g class="kiro-custom kiro-dust" fill="#E0C8A0" opacity="0.75">
            <circle class="p1" cx="340" cy="240" r="11"/>
            <circle class="p2" cx="470" cy="160" r="8"/>
            <circle class="p3" cx="900" cy="200" r="10"/>
            <circle class="p4" cx="980" cy="320" r="7"/>
            <circle class="p5" cx="240" cy="400" r="9"/>
            <circle class="p6" cx="1020" cy="480" r="8"/>
          </g>`);
      } else if (name === "placard") {
        out.push(`
          <g class="kiro-custom kiro-placard" transform="translate(860 560)">
            <path d="M96 140V246" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
            <rect x="0" y="0" width="196" height="148" rx="32" fill="#FFF8F4" stroke="#E8928A" stroke-width="10"/>
            <text x="98" y="94" text-anchor="middle" font-family="Gothic A1, sans-serif" font-weight="800" font-size="58" fill="#E88980">파업</text>
          </g>`);
      } else if (name === "sweat") {
        out.push(`
          <g class="kiro-custom kiro-sweat">
            <path class="sw1" d="M430 430q8 28 20 0q-10 8-20 0Z" fill="#A8D8F0"/>
            <path class="sw2" d="M880 400q8 28 20 0q-10 8-20 0Z" fill="#A8D8F0"/>
          </g>`);
      } else if (name === "bikehelmet") {
        out.push(`
          <g class="kiro-custom kiro-bikehelmet">
            <path d="M400 350a230 210 0 0 1 450 8Z" fill="#DCC8FF"/>
            <rect x="358" y="344" width="534" height="40" rx="20" fill="${INK}"/>
            <path d="M560 220l20 100" stroke="#A57BFF" stroke-width="12" stroke-linecap="round"/>
            <path d="M700 210l-8 110" stroke="#A57BFF" stroke-width="12" stroke-linecap="round"/>
          </g>`);
      } else if (name === "marathonBadge") {
        out.push(`
          <g class="kiro-custom kiro-badge">
            <circle cx="860" cy="360" r="50" fill="#A57BFF"/>
            <circle cx="860" cy="360" r="50" fill="none" stroke="#F7F2FF" stroke-width="8"/>
            <text x="860" y="374" text-anchor="middle" font-family="Gothic A1, sans-serif" font-weight="800" font-size="28" fill="#fff">26</text>
          </g>`);
      } else if (name === "hearts") {
        out.push(`
          <g class="kiro-custom kiro-hearts" fill="#F0A0B8">
            <path class="h1" d="M900 280C860 250 870 210 900 230C930 210 940 250 900 280Z"/>
            <path class="h2" d="M980 200C948 176 956 144 980 160C1004 144 1012 176 980 200Z"/>
            <path class="h3" d="M1040 300C1012 280 1018 252 1040 266C1062 252 1068 280 1040 300Z"/>
          </g>`);
      } else if (name === "sparkles") {
        out.push(`
          <g class="kiro-custom kiro-sparkles" fill="#F6E7A2">
            <path class="s1" d="M320 220l8 18 18 8-18 8-8 18-8-18-18-8 18-8z"/>
            <path class="s2" d="M980 160l10 22 22 10-22 10-10 22-10-22-22-10 22-10z"/>
            <path class="s3" d="M240 420l7 16 16 7-16 7-7 16-7-16-16-7 16-7z"/>
          </g>`);
      }
    }
    return out.join("");
  }

  const SITUATIONS = {
    ordinary: {
      label: "평범", eyes: "sleepy", brows: "none", mouth: "none",
      accessory: "none", prop: "none", blush: false, custom: ["zzz"],
      tile: "#A57BFF", tileSoft: "#C4A6FF", motion: "float",
    },
    construction: {
      label: "공사", eyes: "squint", brows: "flat", mouth: "none",
      accessory: "hardhat", prop: "wrench", blush: false, custom: [],
      tile: "#F3C98A", tileSoft: "#F8DEB4", motion: "hat",
    },
    rain: {
      label: "비", eyes: "canon", brows: "none", mouth: "none",
      accessory: "none", prop: "none", blush: false, custom: ["raincoat", "umbrella", "rain"],
      tile: "#6BA3C9", tileSoft: "#98C4DE", motion: "float",
    },
    dust: {
      label: "미세먼지", eyes: "squint", brows: "none", mouth: "none",
      accessory: "none", prop: "none", blush: false, custom: ["mask", "dust"],
      tile: "#C4A574", tileSoft: "#D8C09A", motion: "idle",
    },
    marathon: {
      label: "마라톤", eyes: "sparkle", brows: "none", mouth: "grin",
      accessory: "bandana", prop: "none", blush: true, custom: ["sweat"],
      tile: "#F090A8", tileSoft: "#F6B8C6", motion: "hop",
    },
    strike: {
      label: "파업", eyes: "wide", brows: "raised", mouth: "oh",
      accessory: "none", prop: "none", blush: false, custom: ["placard"],
      tile: "#E8928A", tileSoft: "#F2B4AE", motion: "nudge",
    },
    congestion: {
      label: "혼잡", eyes: "swirl", brows: "none", mouth: "wobble",
      accessory: "none", prop: "none", blush: false, custom: [],
      tile: "#C97A9A", tileSoft: "#DBA3B8", motion: "nudge",
    },
  };
  // fix typo if any
  SITUATIONS.construction.tileSoft = "#F8DEB4";

  const OUTFITS = {
    base: { label: "기본", accessory: "none", prop: "none", custom: [], limited: false },
    hardhat: { label: "안전모", accessory: "hardhat", prop: "wrench", custom: [], limited: false },
    raincoat: { label: "우비", accessory: "none", prop: "none", custom: ["raincoat", "umbrella"], limited: false },
    mask: { label: "마스크", accessory: "none", prop: "none", custom: ["mask"], limited: false },
    bandana: { label: "머리띠", accessory: "bandana", prop: "none", custom: [], limited: false },
    beanie: { label: "비니", accessory: "beanie", prop: "none", custom: [], limited: false },
    cap: { label: "캡", accessory: "cap", prop: "none", custom: [], limited: false },
    phones: { label: "헤드폰", accessory: "phones", prop: "none", custom: [], limited: false },
    glasses: { label: "안경", eyes: "glasses", accessory: "none", prop: "none", custom: [], limited: false },
    mug: { label: "머그컵", accessory: "none", prop: "mug", custom: [], limited: false },
    crown: { label: "왕관", accessory: "crown", prop: "none", custom: [], limited: false },
    marathon26: { label: "2026 서울마라톤 제보자", accessory: "bandana", prop: "star", custom: ["marathonBadge"], limited: true },
    bikehelmet: { label: "따릉이 헬멧", accessory: "none", prop: "none", custom: ["bikehelmet"], limited: true },
    halo: { label: "완벽한 한 주", accessory: "halo", prop: "none", custom: [], limited: true },
    flower: { label: "봄 한정 꽃", accessory: "flower", prop: "none", custom: [], limited: true },
    party: { label: "시즌 우승", accessory: "party", prop: "star", custom: [], limited: true },
  };

  const EXPRESSIONS = {
    sleepy: {
      label: "평범 졸음", moment: "알림 없는 아침, 홈 기본 상태",
      eyes: "sleepy", brows: "none", mouth: "none", blush: false, custom: ["zzz"], tile: "#A57BFF", tileSoft: "#C4A6FF",
    },
    joy: {
      label: "기쁨", moment: "알림에 “도움됨”을 받았을 때",
      eyes: "canon", brows: "none", mouth: "smile", blush: true, custom: [], tile: "#C4A6FF", tileSoft: "#D9C6FF",
    },
    wink: {
      label: "윙크", moment: "알림을 확인하고 닫을 때",
      eyes: "wink", brows: "none", mouth: "smile", blush: true, custom: [], tile: "#B089F7", tileSoft: "#CDB0FF",
    },
    heart: {
      label: "하트눈", moment: "새 옷을 획득했을 때",
      eyes: "heart", brows: "none", mouth: "smile", blush: true, custom: ["hearts"], tile: "#F090A8", tileSoft: "#F6B8C6",
    },
    sparkle: {
      label: "반짝", moment: "한정판 옷이 열렸을 때",
      eyes: "sparkle", brows: "none", mouth: "grin", blush: true, custom: ["sparkles"], tile: "#F6D56A", tileSoft: "#FBE7A8",
    },
    surprise: {
      label: "놀람", moment: "이상이 처음 감지됐을 때",
      eyes: "wide", brows: "raised", mouth: "oh", blush: false, custom: [], tile: "#E8928A", tileSoft: "#F2B4AE",
    },
    worry: {
      label: "걱정", moment: "혼잡·지연이 큰 날",
      eyes: "squint", brows: "flat", mouth: "wobble", blush: false, custom: [], tile: "#C97A9A", tileSoft: "#DBA3B8",
    },
    yawn: {
      label: "졸린 하품", moment: "밤늦게 앱을 열었을 때",
      eyes: "sleepy", brows: "none", mouth: "open", blush: false, custom: [], tile: "#8B7CC0", tileSoft: "#A8A0D4",
    },
    proud: {
      label: "뿌듯", moment: "제보가 확인·도움됨을 받았을 때",
      eyes: "closed", brows: "none", mouth: "smile", blush: true, custom: [], tile: "#7EC8B0", tileSoft: "#A8DCCE",
    },
    sulk: {
      label: "삐짐", moment: "며칠째 앱에 안 들어왔을 때",
      eyes: "squint", brows: "flat", mouth: "smirk", blush: false, custom: [], tile: "#C4A574", tileSoft: "#D8C09A",
    },
    cheer: {
      label: "응원", moment: "출발 전, “지금 나가면 돼요”",
      eyes: "sparkle", brows: "none", mouth: "smile", blush: true, custom: ["sparkles"], tile: "#A57BFF", tileSoft: "#C4A6FF",
    },
    sleep: {
      label: "잠", moment: "밤 11시 이후, 키로가 잠든 상태",
      eyes: "closed", brows: "none", mouth: "none", blush: false, custom: ["zzz"], tile: "#6B5B8C", tileSoft: "#8A7AA8",
    },
  };
  EXPRESSIONS.yawn.tile = "#8B7CC0";

  let _uid = 0;

  // Custom artwork can occupy the same space as a hat or a handheld prop.
  const CUSTOM_SLOTS = { raincoat: "head", bikehelmet: "head", umbrella: "hand", placard: "hand" };

  function appearance(situation, fit, expr) {
    const slots = new Set((situation?.custom || []).map(name => CUSTOM_SLOTS[name]).filter(Boolean));
    const hasHat = situation && situation.accessory !== "none";
    const hasProp = situation && situation.prop !== "none";
    if (hasHat) slots.add("head");
    if (hasProp) slots.add("hand");
    const fitCustom = (fit?.custom || []).filter(name => !slots.has(CUSTOM_SLOTS[name]));
    const custom = [...new Set([...fitCustom, ...(situation?.custom || []), ...(expr?.custom || [])])];
    return {
      accessory: hasHat ? situation.accessory : (!slots.has("head") && fit?.accessory) || "none",
      prop: hasProp ? situation.prop : (!slots.has("hand") && fit?.prop) || "none",
      // Paint clothing before face accessories, regardless of which layer supplied it.
      custom: custom.includes("raincoat") ? ["raincoat", ...custom.filter(name => name !== "raincoat")] : custom,
    };
  }

  function lighten(hex, amt) {
    if (!hex) return "#C4A6FF";
    const n = hex.replace("#", "");
    const r = Math.min(255, parseInt(n.slice(0, 2), 16) + amt);
    const g = Math.min(255, parseInt(n.slice(2, 4), 16) + amt);
    const b = Math.min(255, parseInt(n.slice(4, 6), 16) + amt);
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  function render(opts) {
    const o = opts || {};
    const expr = o.expression && EXPRESSIONS[o.expression] ? EXPRESSIONS[o.expression] : null;
    const sit = SITUATIONS[o.state] || SITUATIONS.ordinary;
    const fit = o.outfit && OUTFITS[o.outfit] ? OUTFITS[o.outfit] : null;
    const base = expr || sit;
    const activeSituation = sit !== SITUATIONS.ordinary ? sit : null;
    // An alert keeps its equipment and color even during a celebration or sleep.
    // Wardrobe previews still show only the chosen outfit on an ordinary day.
    const look = appearance(activeSituation || (!fit && !expr ? sit : null), fit, expr);
    const face = expr || activeSituation;
    const eyes = o.eyes || face?.eyes || fit?.eyes || (fit ? "canon" : base.eyes);
    const brows = o.brows || face?.brows || (fit ? "none" : base.brows || "none");
    const mouth = o.mouth || face?.mouth || fit?.mouth || (fit ? "none" : base.mouth);
    const accessory = o.accessory || look.accessory;
    const propName = o.prop || look.prop;
    const blush = o.blush != null ? o.blush : (face ? !!face.blush : !fit && !!base.blush);
    const custom = o.custom || look.custom;
    const tile = o.tile || activeSituation?.tile || base.tile || sit.tile;
    const tileSoft = o.tileSoft || activeSituation?.tileSoft || base.tileSoft || lighten(tile, 36);
    const motion = o.motion || "idle";
    const showTile = o.showTile !== false;
    const rounded = o.rounded !== false;
    const uid = "k" + ++_uid;
    const size = o.size || 280;
    const awakeEyes = o.awakeEyes; // optional second eye layer for sleep-in

    const blushArt = blush
      ? `<g class="kiro-blush">
          <ellipse cx="${EL - 20}" cy="600" rx="52" ry="30" fill="${BLUSH}" opacity="0.5"/>
          <ellipse cx="${ER + 34}" cy="600" rx="52" ry="30" fill="${BLUSH}" opacity="0.5"/>
        </g>`
      : "";

    const rx = rounded ? 600 : 260;

    const bodyShade = `
      <radialGradient id="${uid}-body" cx="58%" cy="38%" r="62%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="72%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#EFE8F6"/>
      </radialGradient>
      <radialGradient id="${uid}-tile" cx="50%" cy="38%" r="72%">
        <stop offset="0%" stop-color="${tileSoft}"/>
        <stop offset="100%" stop-color="${tile}"/>
      </radialGradient>
      <filter id="${uid}-blush" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>`;

    const sleepEyes = motion === "sleepin"
      ? `<g class="kiro-eyes kiro-eyes-awake">${EYES.canon}</g>
         <g class="kiro-eyes kiro-eyes-asleep">${EYES.closed}</g>`
      : `<g class="kiro-eyes kiro-eyes-${eyes}">${EYES[eyes] || EYES.canon}</g>`;

    const inner = `
      <ellipse class="kiro-ground-shadow" cx="620" cy="1000" rx="210" ry="40" fill="#2A1F3D" opacity="0.16"/>
      <g class="kiro-body-wrap">
        <path class="kiro-body" d="${BODY}" fill="url(#${uid}-body)"/>
        <g clip-path="url(#${uid}-bodyclip)">
          <ellipse cx="700" cy="840" rx="260" ry="130" fill="#E8DFF3" opacity="0.28"/>
        </g>
        ${blushArt}
        ${sleepEyes}
        <g class="kiro-brows">${BROWS[brows] || ""}</g>
        <g class="kiro-mouth">${MOUTHS[mouth] || ""}</g>
      </g>
      <g class="kiro-hat kiro-hat-${accessory}">${ACCESSORIES[accessory] || ""}</g>
      <g class="kiro-prop">${PROPS[propName] || ""}</g>
      ${customs(uid, custom)}
    `;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="${size}" height="${size}" class="kiro-svg kiro-motion-${motion}" role="img" aria-label="키로">
  <defs>
    ${bodyShade}
    ${showTile ? `<clipPath id="${uid}-tileclip"><rect width="1200" height="1200" rx="${rx}"/></clipPath>` : ""}
    <clipPath id="${uid}-bodyclip"><path d="${BODY}"/></clipPath>
  </defs>
  <g ${showTile ? `clip-path="url(#${uid}-tileclip)"` : ""}>
    ${showTile ? `<rect class="kiro-tile" width="1200" height="1200" rx="${rx}" fill="url(#${uid}-tile)"/>` : ""}
    <g class="kiro-float">
      ${inner}
    </g>
  </g>
</svg>`;
    return svg.replace(/\n\s+/g, " ").trim();
  }

  function mount(el, opts) {
    if (typeof el === "string") el = document.querySelector(el);
    if (!el) return null;
    el.innerHTML = render(opts);
    el.classList.add("kiro-mount");
    if (opts && opts.motion) el.dataset.motion = opts.motion;
    return el;
  }

  return {
    BRAND_PURPLE, SITUATIONS, OUTFITS, EXPRESSIONS,
    EYES, MOUTHS, BROWS, ACCESSORIES, PROPS, render, mount,
  };
});
