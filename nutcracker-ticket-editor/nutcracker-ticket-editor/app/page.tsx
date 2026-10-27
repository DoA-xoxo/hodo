'use client';

import React, { ChangeEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type LayerType = 'border' | 'photo' | 'photoFrame' | 'title' | 'name' | 'label' | 'caption' | 'ornament';
type OrnamentType = 'nutcracker' | 'bow' | 'holly' | 'star' | 'snowflake' | 'bell' | 'laurel' | 'curtain' | 'ribbon';
type Align = 'left' | 'center' | 'right';
type Layer = {
  id: string;
  label: string;
  type: LayerType;
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  rotation: number;
  color?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  align?: Align;
  ornamentType?: OrnamentType;
};
type Colors = { paper: string; border: string; ornament: string; title: string; name: string; frame: string; background: string };
type Design = {
  ticketX: number;
  ticketY: number;
  ticketScale: number;
  colors: Colors;
  layers: Layer[];
  photoDataUrl: string | null;
  photoZoom: number;
  photoPanX: number;
  photoPanY: number;
  transparentBg: boolean;
};
type DragMode = 'move' | 'resize' | 'rotate';
type DragState = {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  startLayer?: Layer;
  startTicketX: number;
  startTicketY: number;
  startTicketScale: number;
  startPanX: number;
  startPanY: number;
  startPhotoZoom: number;
  recorded?: boolean;
};

const DEFAULT_COLORS: Colors = {
  paper: '#fff8eb', border: '#a27d48', ornament: '#a27d48', title: '#913c42', name: '#627867', frame: '#b88d50', background: '#e6ded1',
};
const PRESETS: { name: string; colors: Colors; swatches: string[] }[] = [
  { name: '앤티크 골드', colors: { paper: '#fff7e7', border: '#a47b3f', ornament: '#b18b4b', title: '#87383b', name: '#5d7766', frame: '#bb904e', background: '#e4d8c5' }, swatches: ['#fff7e7', '#a47b3f', '#87383b'] },
  { name: '크림 아이보리', colors: { paper: '#fffdf5', border: '#b4a28a', ornament: '#a89980', title: '#655145', name: '#7c8878', frame: '#baaa91', background: '#e9e5db' }, swatches: ['#fffdf5', '#b4a28a', '#655145'] },
  { name: '크림슨 레드', colors: { paper: '#fff5e9', border: '#a14d4a', ornament: '#a14d4a', title: '#813037', name: '#647760', frame: '#bd8c58', background: '#e7d7cf' }, swatches: ['#fff5e9', '#a14d4a', '#813037'] },
  { name: '파우더 블루', colors: { paper: '#f8fbf8', border: '#7598b0', ornament: '#7e9fb5', title: '#8b4850', name: '#668793', frame: '#91b0c0', background: '#dce5e5' }, swatches: ['#f8fbf8', '#7598b0', '#8b4850'] },
  { name: '더스티 핑크', colors: { paper: '#fff7f1', border: '#bf8e91', ornament: '#bf8e91', title: '#95434d', name: '#7f8c78', frame: '#c59b8a', background: '#eadcda' }, swatches: ['#fff7f1', '#bf8e91', '#95434d'] },
  { name: '민트 그린', colors: { paper: '#fbfbef', border: '#88a99a', ornament: '#83a89a', title: '#905256', name: '#517e70', frame: '#9fba9f', background: '#dce6db' }, swatches: ['#fbfbef', '#88a99a', '#905256'] },
];
const FONT_OPTIONS = [
  { label: '우아한 필기체', value: 'Segoe Script, Brush Script MT, Apple Chancery, cursive' },
  { label: '클래식 세리프', value: 'Georgia, Times New Roman, serif' },
  { label: '고전 이탤릭', value: 'Palatino Linotype, Book Antiqua, Palatino, serif' },
  { label: '빈티지 명조', value: 'Baskerville, Baskerville Old Face, Garamond, serif' },
  { label: '타자기 세리프', value: 'Courier New, Courier, monospace' },
];
const STAMP_PATH = makeStampPath(400, 800, 10, 38);

function makeStampPath(w: number, h: number, notches: number, depth: number) {
  const step = w / notches;
  let d = `M 0 ${depth * 0.7} L 0 0`;
  for (let i = 0; i < notches; i++) d += ` Q ${step * (i + 0.5)} ${depth} ${step * (i + 1)} 0`;
  d += ` L ${w} ${h - depth * 0.7} L ${w} ${h}`;
  for (let i = notches; i > 0; i--) d += ` Q ${step * (i - 0.5)} ${h - depth} ${step * (i - 1)} ${h}`;
  return `${d} Z`;
}

function createDefaultDesign(): Design {
  const c = DEFAULT_COLORS;
  const layers: Layer[] = [
    { id: 'border', label: '우표형 이중 테두리', type: 'border', x: 200, y: 400, w: 400, h: 800, scale: 1, rotation: 0 },
    { id: 'top-label', label: '상단 발레 라벨', type: 'label', x: 200, y: 57, w: 300, h: 25, scale: 1, rotation: 0, text: 'THE ROYAL WINTER BALLET', fontFamily: 'Georgia, serif', fontSize: 11, letterSpacing: 2.5, align: 'center' },
    { id: 'nutcracker', label: '호두까기 인형 병정', type: 'ornament', ornamentType: 'nutcracker', x: 200, y: 145, w: 102, h: 130, scale: 0.76, rotation: 0 },
    { id: 'top-bow', label: '상단 리본', type: 'ornament', ornamentType: 'bow', x: 200, y: 91, w: 88, h: 48, scale: 0.64, rotation: 0 },
    { id: 'star-left', label: '왼쪽 별 장식', type: 'ornament', ornamentType: 'star', x: 99, y: 215, w: 44, h: 44, scale: 0.65, rotation: -10 },
    { id: 'star-right', label: '오른쪽 별 장식', type: 'ornament', ornamentType: 'star', x: 301, y: 215, w: 44, h: 44, scale: 0.65, rotation: 10 },
    { id: 'photo', label: '중앙 사진', type: 'photo', x: 0, y: 0, w: 180, h: 220, scale: 1, rotation: 0 },
    { id: 'photo-frame', label: '타원형 메달리온 액자', type: 'photoFrame', x: 200, y: 333, w: 202, h: 252, scale: 1, rotation: 0 },
    { id: 'title', label: '티켓 제목', type: 'title', x: 200, y: 553, w: 340, h: 66, scale: 1, rotation: 0, text: 'The Nutcracker', fontFamily: FONT_OPTIONS[0].value, fontSize: 38, letterSpacing: 0.2, align: 'center' },
    { id: 'title-flourish', label: '제목 아래 장식', type: 'ornament', ornamentType: 'ribbon', x: 200, y: 591, w: 190, h: 35, scale: 0.8, rotation: 0 },
    { id: 'name', label: '예매자 이름', type: 'name', x: 200, y: 642, w: 280, h: 43, scale: 1, rotation: 0, text: 'TICKET HOLDER', fontFamily: 'Georgia, serif', fontSize: 15, letterSpacing: 2.2, align: 'center' },
    { id: 'caption', label: '하단 안내 문구', type: 'caption', x: 200, y: 690, w: 290, h: 25, scale: 1, rotation: 0, text: 'A CHRISTMAS BALLET · 1892', fontFamily: 'Georgia, serif', fontSize: 9, letterSpacing: 1.65, align: 'center' },
    { id: 'holly-left', label: '왼쪽 홀리 장식', type: 'ornament', ornamentType: 'holly', x: 91, y: 700, w: 78, h: 76, scale: 0.66, rotation: -18 },
    { id: 'holly-right', label: '오른쪽 홀리 장식', type: 'ornament', ornamentType: 'holly', x: 309, y: 700, w: 78, h: 76, scale: 0.66, rotation: 18 },
    { id: 'bottom-ribbon', label: '하단 리본', type: 'ornament', ornamentType: 'ribbon', x: 200, y: 744, w: 158, h: 39, scale: 0.72, rotation: 0 },
    { id: 'bottom-star', label: '하단 눈꽃', type: 'ornament', ornamentType: 'snowflake', x: 200, y: 770, w: 37, h: 37, scale: 0.58, rotation: 0 },
  ];
  return { ticketX: 336, ticketY: 172, ticketScale: 0.82, colors: { ...c }, layers, photoDataUrl: null, photoZoom: 1, photoPanX: 0, photoPanY: 0, transparentBg: false };
}

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
function layerGlyph(layer: Layer) {
  if (layer.type === 'border') return '▤';
  if (layer.type === 'photo') return '◉';
  if (layer.type === 'photoFrame') return '◎';
  if (layer.type === 'title') return 'Aa';
  if (layer.type === 'name') return 'T';
  if (layer.type === 'label' || layer.type === 'caption') return '≋';
  const glyphs: Record<OrnamentType, string> = { nutcracker: '♙', bow: '♧', holly: '❧', star: '✦', snowflake: '❄', bell: '♢', laurel: '❦', curtain: '⌁', ribbon: '〰' };
  return glyphs[layer.ornamentType || 'star'];
}
function getLayerColor(layer: Layer, design: Design) {
  if (layer.type === 'border') return design.colors.border;
  if (layer.type === 'title') return design.colors.title;
  if (layer.type === 'name') return design.colors.name;
  if (layer.type === 'photoFrame') return design.colors.frame;
  return layer.color || design.colors.ornament;
}
function layerTransform(layer: Layer) { return `translate(${layer.x} ${layer.y}) rotate(${layer.rotation}) scale(${layer.scale})`; }
function frameLayer(design: Design) { return design.layers.find(l => l.type === 'photoFrame') || { id: 'photo-frame', label: '사진 프레임', type: 'photoFrame' as const, x: 200, y: 333, w: 202, h: 252, scale: 1, rotation: 0 }; }

function NutcrackerSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-29 -43 L-25 -56 L-11 -54 L-7 -65 L8 -65 L12 -54 L26 -56 L30 -43 Z" />
    <path d="M-25 -43 L25 -43 M-17 -55 L-14 -61 M0 -54 L0 -61 M17 -55 L14 -61" />
    <path d="M-23 -40 Q-29 -27 -22 -12 L-16 -4 L16 -4 L22 -12 Q29 -27 23 -40 Q0 -51 -23 -40Z" />
    <path d="M-18 -23 Q-7 -28 0 -21 Q7 -28 18 -23 M-15 -12 Q0 -4 15 -12" />
    <path d="M-17 -5 L-22 5 L-32 20 L-27 26 L-12 13 L-8 2 M17 -5 L22 5 L32 20 L27 26 L12 13 L8 2" />
    <path d="M-15 -3 L-18 31 L-12 40 L12 40 L18 31 L15 -3 Z" />
    <path d="M-16 6 L16 6 M-16 19 L16 19 M-12 31 L12 31" />
    <path d="M-10 3 L-10 37 M0 5 L0 38 M10 3 L10 37" strokeWidth="1.3" />
    <circle cx="0" cy="12" r="2.2" fill={color} /><circle cx="0" cy="24" r="2.2" fill={color} />
    <path d="M-13 40 L-15 49 L-29 51 L-31 57 L-3 57 L-1 50 L1 50 L3 57 L31 57 L29 51 L15 49 L13 40" />
    <path d="M-24 -2 L-32 9 M24 -2 L32 9 M-20 1 L-27 6 M20 1 L27 6" strokeWidth="1.5" />
    <path d="M-28 -32 Q-40 -30 -37 -20 Q-33 -13 -26 -17 M28 -32 Q40 -30 37 -20 Q33 -13 26 -17" />
    <path d="M-22 -34 Q-16 -29 -11 -32 M22 -34 Q16 -29 11 -32" />
  </g>;
}
function BowSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-3 0 C-24 -29 -57 -24 -49 -7 C-43 7 -21 8 -3 2 C-20 16 -23 31 -13 30 C-4 29 1 12 0 3 C2 15 10 30 18 28 C30 25 18 10 4 2 C25 9 46 7 49 -6 C53 -22 22 -28 3 0" />
    <path d="M-2 4 L-18 40 L-4 32 L3 39 L6 4 M4 4 L27 35 L23 20 L11 7" />
    <ellipse cx="0" cy="1" rx="6" ry="7" fill={color} fillOpacity=".12" />
  </g>;
}
function HollySvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-37 34 Q-2 5 35 -35" />
    <path d="M-24 22 Q-40 11 -42 -5 Q-27 -8 -18 4 Q-25 -13 -12 -21 Q2 -10 -2 3 Q13 -13 27 -7 Q24 9 8 14 Q28 8 35 20 Q22 34 7 27" />
    <path d="M-29 19 L-21 13 L-18 4 M-12 -9 L-3 -3 L-2 3 M9 -5 L12 6 L8 14 M19 15 L11 23 L7 27" strokeWidth="1.1" />
    <circle cx="-6" cy="12" r="5" fill={color} fillOpacity=".9" /><circle cx="4" cy="5" r="4.6" fill={color} fillOpacity=".9" /><circle cx="1" cy="18" r="4.4" fill={color} fillOpacity=".9" />
    <path d="M-6 7 L-4 4 M4 0 L6 -3 M1 13 L4 11" strokeWidth="1.1" />
  </g>;
}
function StarSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 -28 L5 -7 L26 0 L5 5 L0 28 L-5 5 L-26 0 L-5 -7 Z" />
    <path d="M-15 -19 L-12 -12 M15 17 L18 20" strokeWidth="1.2" />
    <circle cx="29" cy="-20" r="2.5" fill={color} /><circle cx="-28" cy="20" r="2" fill={color} />
  </g>;
}
function SnowflakeSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 -28 L0 28 M-24 -14 L24 14 M-24 14 L24 -14" />
    <path d="M0 -28 L-5 -21 M0 -28 L5 -21 M0 28 L-5 21 M0 28 L5 21 M-24 -14 L-15 -14 M-24 -14 L-20 -6 M24 14 L15 14 M24 14 L20 6 M-24 14 L-15 14 M-24 14 L-20 6 M24 -14 L15 -14 M24 -14 L20 -6" strokeWidth="1.6" />
    <circle r="3" fill={color} />
  </g>;
}
function BellSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-19 15 Q-12 3 -12 -10 Q-11 -24 0 -26 Q11 -24 12 -10 Q12 3 19 15 Z" />
    <path d="M-24 16 Q0 22 24 16 M-5 -29 Q0 -37 5 -29 M-7 23 Q-5 31 0 31 Q5 31 7 23" />
    <path d="M-8 -16 Q0 -21 8 -16" strokeWidth="1.3" />
  </g>;
}
function LaurelSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-36 34 Q0 0 34 -34" />
    {Array.from({ length: 7 }, (_, i) => { const x = -29 + i * 9, y = 25 - i * 8.5; return <g key={i} transform={`translate(${x} ${y}) rotate(${-38 - i * 4})`}><path d="M0 0 Q-17 -15 -9 -23 Q4 -17 0 0Z" /><path d="M0 0 L-8 -17" strokeWidth="1" /></g>; })}
    {Array.from({ length: 7 }, (_, i) => { const x = -20 + i * 8.4, y = 7 - i * 8.2; return <g key={`b${i}`} transform={`translate(${x} ${y}) rotate(${35 + i * 3})`}><path d="M0 0 Q16 -15 10 -22 Q-3 -16 0 0Z" /><path d="M0 0 L8 -16" strokeWidth="1" /></g>; })}
  </g>;
}
function CurtainSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-44 -34 Q-33 -10 -41 13 Q-26 4 -18 -9 Q-19 13 -8 21 L-14 -30 M44 -34 Q33 -10 41 13 Q26 4 18 -9 Q19 13 8 21 L14 -30" />
    <path d="M-47 -36 Q0 -24 47 -36 M-13 -31 Q0 -20 13 -31 M-8 22 L0 31 L8 22" />
    <path d="M-36 -25 Q-29 -17 -31 -8 M36 -25 Q29 -17 31 -8" strokeWidth="1.2" />
    <circle cx="-43" cy="-35" r="3" fill={color} /><circle cx="43" cy="-35" r="3" fill={color} />
  </g>;
}
function RibbonSvg({ color }: { color: string }) {
  return <g stroke={color} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-81 0 Q-58 -3 -43 0 L-52 -13 L-32 -6 L-20 -12 Q0 -19 20 -12 L32 -6 L52 -13 L43 0 Q58 -3 81 0 L69 9 L79 18 L48 13 Q20 23 0 13 Q-20 23 -48 13 L-79 18 L-69 9 Z" />
    <path d="M-32 -6 Q0 4 32 -6 M-48 13 Q0 4 48 13 M-17 5 L0 12 L17 5" strokeWidth="1.1" />
  </g>;
}

function Ornament({ type, color }: { type: OrnamentType; color: string }) {
  if (type === 'nutcracker') return <NutcrackerSvg color={color} />;
  if (type === 'bow') return <BowSvg color={color} />;
  if (type === 'holly') return <HollySvg color={color} />;
  if (type === 'star') return <StarSvg color={color} />;
  if (type === 'snowflake') return <SnowflakeSvg color={color} />;
  if (type === 'bell') return <BellSvg color={color} />;
  if (type === 'laurel') return <LaurelSvg color={color} />;
  if (type === 'curtain') return <CurtainSvg color={color} />;
  return <RibbonSvg color={color} />;
}

type ArtworkProps = {
  design: Design;
  selectedId?: string | null;
  editor?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  onLayerPointerDown?: (id: string, e: ReactPointerEvent<SVGElement>, mode?: DragMode) => void;
  onBackgroundPointerDown?: () => void;
  onPointerMove?: (e: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<SVGSVGElement>) => void;
};

function ArtworkSvg({ design, selectedId = null, editor = false, svgRef, onLayerPointerDown, onBackgroundPointerDown, onPointerMove, onPointerUp }: ArtworkProps) {
  const frame = frameLayer(design);
  const renderTransform = (layer: Layer) => layerTransform(layer);
  const renderSelection = (layer: Layer, transformOverride?: string, alreadyInLayerTransform = false) => {
    if (!editor || selectedId !== layer.id) return null;
    const transform = transformOverride || (alreadyInLayerTransform ? undefined : renderTransform(layer));
    const w = layer.w || 80, h = layer.h || 50;
    return <g key={`sel-${layer.id}`} data-editor-only="true" transform={transform}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="none" stroke="#9f5554" strokeWidth="1.3" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />
      <line x1="0" y1={-h / 2} x2="0" y2={-h / 2 - 19} stroke="#9f5554" strokeWidth="1.2" vectorEffect="non-scaling-stroke" pointerEvents="none" />
      <circle cx="0" cy={-h / 2 - 19} r="5.8" fill="#fff8ed" stroke="#9f5554" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ cursor: 'grab', pointerEvents: 'all' }} onPointerDown={e => onLayerPointerDown?.(layer.id, e, 'rotate')} />
      <circle cx={w / 2} cy={h / 2} r="6.2" fill="#fff8ed" stroke="#9f5554" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ cursor: 'nwse-resize', pointerEvents: 'all' }} onPointerDown={e => onLayerPointerDown?.(layer.id, e, 'resize')} />
    </g>;
  };
  const layerNodes = design.layers.map(layer => {
    const color = getLayerColor(layer, design);
    if (layer.type === 'border') {
      return <g key={layer.id} transform={renderTransform(layer)} onPointerDown={editor ? e => onLayerPointerDown?.(layer.id, e) : undefined} style={editor ? { cursor: 'move' } : undefined}>
        <g transform="translate(-200 -400)">
          <path d={STAMP_PATH} fill="none" stroke={color} strokeWidth="2.4" />
          <path d={STAMP_PATH} transform="translate(15 18) scale(.925 .955)" fill="none" stroke={color} strokeWidth="1.3" />
          <path d="M27 62 Q27 54 35 54 L47 54 M353 54 L365 54 Q373 54 373 62 M27 738 Q27 746 35 746 L47 746 M353 746 L365 746 Q373 746 373 738" fill="none" stroke={color} strokeWidth="1.2" />
        </g>
        {renderSelection(layer, undefined, true)}
      </g>;
    }
    if (layer.type === 'photo') {
      const pz = design.photoZoom;
      const frameTransform = `translate(${frame.x} ${frame.y}) rotate(${frame.rotation}) scale(${frame.scale})`;
      return <g key={layer.id}>
        <g transform={frameTransform} clipPath="url(#nutcracker-photo-clip)" onPointerDown={editor ? e => onLayerPointerDown?.(layer.id, e) : undefined} style={editor ? { cursor: design.photoDataUrl ? 'move' : 'pointer' } : undefined}>
          {design.photoDataUrl ? <image href={design.photoDataUrl} x={-105 * pz + design.photoPanX} y={-125 * pz + design.photoPanY} width={210 * pz} height={250 * pz} preserveAspectRatio="xMidYMid slice" transform={`rotate(${layer.rotation})`} /> : <g>
            <rect x="-90" y="-118" width="180" height="236" fill="#f3e7d5" />
            <path d="M-73 -79 Q-47 -113 0 -113 Q48 -113 73 -79" fill="none" stroke={design.colors.frame} strokeWidth="1.1" strokeDasharray="2 5" />
            <circle cx="0" cy="-27" r="31" fill={design.colors.ornament} fillOpacity=".23" />
            <path d="M-50 62 Q-44 7 0 8 Q44 7 50 62 L50 88 L-50 88 Z" fill={design.colors.ornament} fillOpacity=".23" />
            <path d="M-32 -32 Q-20 -55 0 -53 Q24 -53 32 -31" fill="none" stroke={design.colors.frame} strokeWidth="2" />
            <g fill={design.colors.frame}>
              <circle cx="-48" cy="-72" r="2" /><circle cx="48" cy="-72" r="2" /><circle cx="0" cy="-91" r="2" />
            </g>
          </g>}
        </g>
        {renderSelection(layer, frameTransform)}
      </g>;
    }
    if (layer.type === 'photoFrame') {
      return <g key={layer.id} transform={renderTransform(layer)} onPointerDown={editor ? e => onLayerPointerDown?.(layer.id, e) : undefined} style={editor ? { cursor: 'move' } : undefined}>
        <g stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <ellipse rx="86" ry="114" strokeWidth="2.6" />
          <ellipse rx="78" ry="105" strokeWidth="1.3" />
          <ellipse rx="72" ry="98" strokeWidth="1" strokeDasharray="1.5 5" />
          <path d="M-68 -80 Q-94 -100 -98 -70 Q-88 -53 -79 -65 M68 -80 Q94 -100 98 -70 Q88 -53 79 -65" strokeWidth="1.7" />
          <path d="M-70 82 Q-91 99 -81 116 Q-68 116 -62 102 M70 82 Q91 99 81 116 Q68 116 62 102" strokeWidth="1.7" />
          <path d="M-51 -96 Q-43 -114 -27 -116 M51 -96 Q43 -114 27 -116" strokeWidth="1.5" />
          <path d="M-20 -113 Q0 -128 20 -113 Q0 -104 -20 -113Z" fill={color} fillOpacity=".12" strokeWidth="1.3" />
          <path d="M-31 116 Q0 130 31 116 M-18 121 L-13 130 L0 124 L13 130 L18 121" strokeWidth="1.3" />
          {[-1, 1].map(side => <g key={side} transform={`translate(${side * 94} 0) rotate(${side * 16})`}>
            <path d="M0 -9 Q-10 -22 -8 -30 Q2 -25 4 -14 Q8 -27 18 -28 Q19 -16 4 -7" strokeWidth="1.2" />
            <circle cx="4" cy="0" r="3" fill={color} />
          </g>)}
        </g>
        {renderSelection(layer, undefined, true)}
      </g>;
    }
    if (layer.type === 'title' || layer.type === 'name' || layer.type === 'label' || layer.type === 'caption') {
      const size = layer.fontSize || 18;
      const anchor = layer.align === 'left' ? 'start' : layer.align === 'right' ? 'end' : 'middle';
      const textX = layer.align === 'left' ? -layer.w / 2 : layer.align === 'right' ? layer.w / 2 : 0;
      return <g key={layer.id} transform={renderTransform(layer)} onPointerDown={editor ? e => onLayerPointerDown?.(layer.id, e) : undefined} style={editor ? { cursor: 'move' } : undefined}>
        <text x={textX} y={size * 0.34} textAnchor={anchor} fill={color} fontFamily={layer.fontFamily || 'Georgia, serif'} fontSize={size} letterSpacing={layer.letterSpacing || 0} fontStyle={layer.type === 'title' ? 'italic' : 'normal'} fontWeight={layer.type === 'title' ? 500 : 400}>{layer.text || ''}</text>
        {renderSelection(layer, undefined, true)}
      </g>;
    }
    const type = layer.ornamentType || 'star';
    return <g key={layer.id} transform={renderTransform(layer)} onPointerDown={editor ? e => onLayerPointerDown?.(layer.id, e) : undefined} style={editor ? { cursor: 'move' } : undefined}>
      <Ornament type={type} color={color} />
      {renderSelection(layer, undefined, true)}
    </g>;
  });
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role={editor ? 'application' : 'img'} aria-label="The Nutcracker ticket preview" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <defs>
      <clipPath id="nutcracker-photo-clip" clipPathUnits="userSpaceOnUse"><ellipse cx="0" cy="0" rx="76" ry="100" /></clipPath>
    </defs>
    {design.transparentBg ? (editor ? <rect x="0" y="0" width="1000" height="1000" fill="transparent" onPointerDown={e => { if (e.target === e.currentTarget) onBackgroundPointerDown?.(); }} /> : null) : <rect id="canvas-background" x="0" y="0" width="1000" height="1000" fill={design.colors.background} onPointerDown={editor ? e => { if (e.target === e.currentTarget) onBackgroundPointerDown?.(); } : undefined} />}
    <g transform={`translate(${design.ticketX} ${design.ticketY}) scale(${design.ticketScale})`}>
      <path d={STAMP_PATH} fill={design.colors.paper} onPointerDown={editor ? e => onLayerPointerDown?.('ticket', e) : undefined} style={editor ? { cursor: 'move' } : undefined} />
      {layerNodes}
      {editor && selectedId === 'ticket' && <path data-editor-only="true" d={STAMP_PATH} fill="none" stroke="#9f5554" strokeWidth="2.5" strokeDasharray="7 5" pointerEvents="none" />}
    </g>

  </svg>;
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) { return <div className="section-title"><span>{children}</span>{hint && <span className="section-hint">{hint}</span>}</div>; }
function RangeControl({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  return <div className="field"><label className="field-label">{label}</label><div className="range-line"><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /><span className="range-value">{value.toFixed(step < 1 ? 2 : 0)}{suffix}</span></div></div>;
}
function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value.toUpperCase());
  useEffect(() => setDraft(value.toUpperCase()), [value]);
  return <div className="field"><label className="field-label">{label}</label><div className="color-line"><input className="color-input" aria-label={`${label} color`} type="color" value={value} onChange={e => { setDraft(e.target.value.toUpperCase()); onChange(e.target.value); }} /><input className="hex-input" aria-label={`${label} HEX`} value={draft} maxLength={7} onChange={e => { const v = e.target.value.toUpperCase(); setDraft(v); if (/^#[0-9A-F]{6}$/.test(v)) onChange(v); }} onBlur={() => setDraft(value.toUpperCase())} /></div></div>;
}

export default function Home() {
  const [design, setDesign] = useState<Design>(() => createDefaultDesign());
  const designRef = useRef(design);
  const [selectedId, setSelectedId] = useState<string | null>('title');
  const [activeTab, setActiveTab] = useState<'edit' | 'add' | 'layers'>('edit');
  const [undoStack, setUndoStack] = useState<Design[]>([]);
  const [redoStack, setRedoStack] = useState<Design[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const currentLayer = useMemo(() => design.layers.find(l => l.id === selectedId) || null, [design.layers, selectedId]);
  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }, []);

  const updateDesign = useCallback((updater: (current: Design) => Design, record = true) => {
    const current = designRef.current;
    const next = updater(current);
    if (next === current) return;
    if (record) {
      setUndoStack(stack => [...stack, current].slice(-70));
      setRedoStack([]);
    }
    designRef.current = next;
    setDesign(next);
  }, []);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    const current = designRef.current;
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([current, ...redoStack].slice(0, 70));
    designRef.current = previous;
    setDesign(previous);
  }, [undoStack, redoStack]);
  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[0];
    const current = designRef.current;
    setRedoStack(redoStack.slice(1));
    setUndoStack([...undoStack, current].slice(-70));
    designRef.current = next;
    setDesign(next);
  }, [undoStack, redoStack]);

  const onLayerPointerDown = useCallback((id: string, e: ReactPointerEvent<SVGElement>, mode: DragMode = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    const svg = svgRef.current;
    if (svg) {
      try { svg.setPointerCapture(e.pointerId); } catch { /* capture can fail if the pointer left the SVG */ }
    }
    const bounds = svg?.getBoundingClientRect();
    const sx = bounds ? (e.clientX - bounds.left) / bounds.width * 1000 : e.clientX;
    const sy = bounds ? (e.clientY - bounds.top) / bounds.height * 1000 : e.clientY;
    const d = designRef.current;
    const layer = d.layers.find(l => l.id === id);
    dragRef.current = { id, mode, startX: sx, startY: sy, startLayer: layer ? { ...layer } : undefined, startTicketX: d.ticketX, startTicketY: d.ticketY, startTicketScale: d.ticketScale, startPanX: d.photoPanX, startPanY: d.photoPanY, startPhotoZoom: d.photoZoom };
    setSelectedId(id);
  }, []);

  const pointerToCanvas = (e: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - bounds.left) / bounds.width * 1000, y: (e.clientY - bounds.top) / bounds.height * 1000 };
  };
  const onPointerMove = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.preventDefault();
    if (!drag.recorded) { setUndoStack(stack => [...stack, designRef.current].slice(-70)); setRedoStack([]); drag.recorded = true; }
    const point = pointerToCanvas(e);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const base = designRef.current;
    if (drag.id === 'ticket') {
      const s = drag.startTicketScale;
      updateDesign(cur => ({ ...cur, ticketX: clamp(drag.startTicketX + dx, 0, 1000 - 400 * s), ticketY: clamp(drag.startTicketY + dy, 0, 1000 - 800 * s) }), false);
      return;
    }
    if (drag.id === 'photo') {
      if (drag.mode === 'move') updateDesign(cur => ({ ...cur, photoPanX: drag.startPanX + dx / drag.startTicketScale / Math.max(.35, frameLayer(base).scale), photoPanY: drag.startPanY + dy / drag.startTicketScale / Math.max(.35, frameLayer(base).scale) }), false);
      if (drag.mode === 'resize') updateDesign(cur => ({ ...cur, photoZoom: clamp(drag.startPhotoZoom + (dx - dy) / 180, .55, 2.8) }), false);
      if (drag.mode === 'rotate' && drag.startLayer) updateDesign(cur => ({ ...cur, layers: cur.layers.map(l => l.id === 'photo' ? { ...l, rotation: drag.startLayer!.rotation + dx * .65 } : l) }), false);
      return;
    }
    if (!drag.startLayer) return;
    const ticketScale = drag.startTicketScale;
    if (drag.mode === 'move') {
      const localDx = dx / ticketScale, localDy = dy / ticketScale;
      updateDesign(cur => ({ ...cur, layers: cur.layers.map(l => l.id === drag.id ? { ...l, x: drag.startLayer!.x + localDx, y: drag.startLayer!.y + localDy } : l) }), false);
    } else if (drag.mode === 'resize') {
      const nextScale = clamp(drag.startLayer.scale + (dx - dy) / 170, .18, 3.2);
      updateDesign(cur => ({ ...cur, layers: cur.layers.map(l => l.id === drag.id ? { ...l, scale: nextScale } : l) }), false);
    } else {
      const nextRotation = drag.startLayer.rotation + dx * .65;
      updateDesign(cur => ({ ...cur, layers: cur.layers.map(l => l.id === drag.id ? { ...l, rotation: nextRotation } : l) }), false);
    }
  }, [updateDesign]);
  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  const patchLayer = useCallback((id: string, patch: Partial<Layer>) => updateDesign(cur => ({ ...cur, layers: cur.layers.map(l => l.id === id ? { ...l, ...patch } : l) })), [updateDesign]);
  const patchColors = useCallback((patch: Partial<Colors>) => updateDesign(cur => ({ ...cur, colors: { ...cur.colors, ...patch } })), [updateDesign]);
  const selectedColor = currentLayer ? getLayerColor(currentLayer, design) : design.colors.paper;
  const changeSelectedColor = (value: string) => {
    if (!currentLayer) { patchColors({ paper: value }); return; }
    if (currentLayer.type === 'border') patchColors({ border: value });
    else if (currentLayer.type === 'title') patchColors({ title: value });
    else if (currentLayer.type === 'name') patchColors({ name: value });
    else if (currentLayer.type === 'photoFrame') patchColors({ frame: value });
    else if (['ornament', 'label', 'caption'].includes(currentLayer.type)) patchLayer(currentLayer.id, { color: value });
  };

  const centerTicket = () => updateDesign(cur => ({ ...cur, ticketX: (1000 - 400 * cur.ticketScale) / 2, ticketY: (1000 - 800 * cur.ticketScale) / 2 }));
  const resetTicketPosition = () => updateDesign(cur => ({ ...cur, ticketX: 336, ticketY: 172 }));
  const resetAll = () => {
    if (!window.confirm('현재 디자인을 기본 템플릿으로 초기화할까요? 실행 취소로 되돌릴 수 있습니다.')) return;
    updateDesign(() => createDefaultDesign()); setSelectedId('title'); setActiveTab('edit'); showToast('기본 티켓으로 초기화했어요.');
  };
  const deleteSelected = () => {
    if (!selectedId || selectedId === 'ticket') return;
    if (selectedId === 'photo') {
      updateDesign(cur => ({ ...cur, photoDataUrl: null, photoZoom: 1, photoPanX: 0, photoPanY: 0 }));
      showToast('사진을 삭제했어요. 사진 레이어와 액자는 유지됩니다.');
      return;
    }
    updateDesign(cur => ({ ...cur, layers: cur.layers.filter(l => l.id !== selectedId) }));
    setSelectedId('ticket'); showToast('선택한 요소를 삭제했어요.');
  };
  const addLayer = (kind: 'title' | 'name' | 'photoFrame' | OrnamentType) => {
    const id = `${kind}-${Date.now()}`;
    let layer: Layer;
    if (kind === 'title' || kind === 'name') {
      layer = { id, label: kind === 'title' ? '새 제목' : '새 이름', type: kind, x: 200, y: kind === 'title' ? 555 : 640, w: 320, h: 58, scale: 1, rotation: 0, text: kind === 'title' ? 'The Nutcracker' : 'TICKET HOLDER', fontFamily: kind === 'title' ? FONT_OPTIONS[0].value : 'Georgia, serif', fontSize: kind === 'title' ? 34 : 15, letterSpacing: kind === 'title' ? 0 : 1.5, align: 'center' };
    } else if (kind === 'photoFrame') {
      layer = { id, label: '추가 사진 액자', type: 'photoFrame', x: 200, y: 333, w: 202, h: 252, scale: .8, rotation: 0 };
    } else {
      const dims: Record<OrnamentType, [number, number]> = { nutcracker: [100, 130], bow: [88, 52], holly: [78, 76], star: [46, 46], snowflake: [42, 42], bell: [44, 50], laurel: [80, 80], curtain: [90, 70], ribbon: [165, 42] };
      const [w, h] = dims[kind];
      layer = { id, label: ({ nutcracker: '호두까기 인형', bow: '리본', holly: '홀리 장식', star: '별 장식', snowflake: '눈꽃', bell: '크리스마스 방울', laurel: '월계수', curtain: '발레 커튼', ribbon: '장식 리본' } as Record<OrnamentType, string>)[kind], type: 'ornament', ornamentType: kind, x: 200, y: 400, w, h, scale: .7, rotation: 0 };
    }
    updateDesign(cur => ({ ...cur, layers: [...cur.layers, layer] })); setSelectedId(id); setActiveTab('edit');
    showToast(`${layer.label} 요소를 추가했어요.`);
  };
  const moveLayerOrder = (id: string, delta: -1 | 1) => updateDesign(cur => {
    const from = cur.layers.findIndex(l => l.id === id); const to = from + delta;
    if (from < 0 || to < 0 || to >= cur.layers.length) return cur;
    const layers = [...cur.layers]; [layers[from], layers[to]] = [layers[to], layers[from]];
    return { ...cur, layers };
  });
  const applyPreset = (preset: typeof PRESETS[number]) => {
    updateDesign(cur => ({ ...cur, colors: { ...preset.colors }, layers: cur.layers.map(l => l.type === 'ornament' || l.type === 'label' || l.type === 'caption' ? { ...l, color: undefined } : l) }));
    showToast(`${preset.name} 팔레트를 적용했어요.`);
  };
  const onPhotoFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('이미지 파일을 선택해 주세요.'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) { showToast('이미지를 읽지 못했어요. 다시 선택해 주세요.'); return; }
      updateDesign(cur => ({ ...cur, photoDataUrl: result, photoZoom: 1, photoPanX: 0, photoPanY: 0 }));
      setSelectedId('photo'); setActiveTab('edit'); showToast('사진을 브라우저 안에 불러왔어요.');
      e.target.value = '';
    };
    reader.onerror = () => showToast('이미지를 읽지 못했어요.');
    reader.readAsDataURL(file);
  };
  const removePhoto = () => updateDesign(cur => ({ ...cur, photoDataUrl: null, photoZoom: 1, photoPanX: 0, photoPanY: 0 }));

  const exportPng = async () => {
    const svg = svgRef.current;
    if (!svg) { showToast('미리보기 캔버스를 찾지 못했어요.'); return; }
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.querySelectorAll('[data-editor-only]').forEach(node => node.remove());
      clone.querySelectorAll('[data-editor-only="true"]').forEach(node => node.remove());
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', '1600'); clone.setAttribute('height', '1600');
      clone.setAttribute('viewBox', '0 0 1000 1000');
      clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const markup = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1600;
        const context = canvas.getContext('2d');
        if (!context) { URL.revokeObjectURL(url); showToast('PNG 렌더링을 시작하지 못했어요.'); return; }
        context.clearRect(0, 0, 1600, 1600);
        context.drawImage(image, 0, 0, 1600, 1600);
        URL.revokeObjectURL(url);
        canvas.toBlob(png => {
          if (!png) { showToast('PNG 파일을 생성하지 못했어요.'); return; }
          const downloadUrl = URL.createObjectURL(png);
          const anchor = document.createElement('a'); anchor.href = downloadUrl; anchor.download = 'The-Nutcracker-Ticket.png';
          document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(downloadUrl);
          showToast('1600 × 1600px PNG를 저장했어요.');
        }, 'image/png');
      };
      image.onerror = () => { URL.revokeObjectURL(url); showToast('이미지를 렌더링하지 못했어요. 폰트 또는 사진을 확인해 주세요.'); };
      image.src = url;
    } catch (error) {
      console.error(error); showToast('다운로드 중 오류가 발생했어요. 다시 시도해 주세요.');
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !typing) { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y' && !typing) { event.preventDefault(); redo(); }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !typing && selectedId && selectedId !== 'ticket') { event.preventDefault(); deleteSelected(); }
      if (event.key === 'Escape' && previewOpen) setPreviewOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, selectedId, previewOpen]);

  const selectedLayerColorAllowed = !currentLayer || currentLayer.type !== 'photo';
  const canColorSelected = !currentLayer || ['border', 'title', 'name', 'photoFrame', 'ornament', 'label', 'caption'].includes(currentLayer.type);
  const displayLayers = [...design.layers].reverse();

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-lockup"><div className="brand-mark">✳</div><div><h1 className="brand-title">Noël Ticket Studio</h1><div className="brand-subtitle">Antique Christmas · Ticket Atelier</div></div></div>
      <div className="top-actions">
        <button className="btn" onClick={undo} disabled={!undoStack.length} title="Ctrl/⌘ + Z">↶ 실행 취소</button>
        <button className="btn" onClick={redo} disabled={!redoStack.length} title="Ctrl/⌘ + Shift + Z">↷ 다시 실행</button>
        <button className="btn" onClick={resetAll}>↺ 초기화</button>
        <button className="btn" onClick={() => setPreviewOpen(true)}>▧ 최종 미리보기</button>
        <button className="btn btn-primary" onClick={exportPng}>↓ PNG 다운로드</button>
      </div>
    </header>

    <div className="workspace">
      <aside className="panel">
        <div className="panel-head"><div><div className="eyebrow">Your own keepsake</div><h2 className="panel-title">디자인 편집</h2></div><span className="eyebrow">01 / Atelier</span></div>
        <div className="tabbar">
          <button className={`tab ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>속성 편집</button>
          <button className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>요소 추가</button>
          <button className={`tab ${activeTab === 'layers' ? 'active' : ''}`} onClick={() => setActiveTab('layers')}>레이어</button>
        </div>
        <div className="panel-body">
          {activeTab === 'edit' && <>
            <section className="section">
              <SectionTitle hint={selectedId === 'ticket' ? '전체 티켓' : currentLayer?.label || '선택 없음'}>선택 요소</SectionTitle>
              {!currentLayer || selectedId === 'ticket' ? <>
                <p className="subtle-note" style={{ marginTop: 0, marginBottom: 12 }}>티켓 바탕을 클릭하거나 레이어를 선택해 편집하세요. 티켓은 미리보기에서 직접 드래그할 수 있어요.</p>
                <RangeControl label="티켓 크기" value={design.ticketScale} min={0.58} max={0.98} step={0.01} suffix="×" onChange={v => updateDesign(cur => ({ ...cur, ticketScale: v, ticketX: clamp(cur.ticketX, 0, 1000 - 400 * v), ticketY: clamp(cur.ticketY, 0, 1000 - 800 * v) }))} />
                <div className="two-buttons"><button className="btn btn-small" onClick={centerTicket}>⊙ 중앙 정렬</button><button className="btn btn-small" onClick={resetTicketPosition}>위치 초기화</button></div>
              </> : <>
                {['title', 'name', 'label', 'caption'].includes(currentLayer.type) && <>
                  <div className="field"><label className="field-label">텍스트 내용</label><input className="text-input" value={currentLayer.text || ''} onChange={e => patchLayer(currentLayer.id, { text: e.target.value })} /></div>
                  <div className="field"><label className="field-label">글꼴</label><select className="select-input" value={currentLayer.fontFamily || FONT_OPTIONS[1].value} onChange={e => patchLayer(currentLayer.id, { fontFamily: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
                  <RangeControl label="글자 크기" value={currentLayer.fontSize || 18} min={8} max={62} step={1} suffix="px" onChange={v => patchLayer(currentLayer.id, { fontSize: v })} />
                  <RangeControl label="글자 간격" value={currentLayer.letterSpacing || 0} min={-1} max={6} step={0.1} suffix="px" onChange={v => patchLayer(currentLayer.id, { letterSpacing: v })} />
                  <div className="field"><label className="field-label">정렬</label><div className="align-control">{(['left', 'center', 'right'] as Align[]).map(a => <button key={a} className={`align-button ${(currentLayer.align || 'center') === a ? 'active' : ''}`} onClick={() => patchLayer(currentLayer.id, { align: a })}>{a === 'left' ? '왼쪽' : a === 'center' ? '가운데' : '오른쪽'}</button>)}</div></div>
                </>}
                {currentLayer.type === 'photo' && <>
                  <div className="field"><label className="field-label">사진 파일 (기기 안에서만 처리)</label><button className="btn" onClick={() => fileInputRef.current?.click()}>{design.photoDataUrl ? '사진 교체하기' : '사진 업로드하기'}</button><input ref={fileInputRef} className="hidden-file" type="file" accept="image/*" onChange={onPhotoFile} /></div>
                  <RangeControl label="사진 확대·축소" value={design.photoZoom} min={0.55} max={2.8} step={0.05} suffix="×" onChange={v => updateDesign(cur => ({ ...cur, photoZoom: v }))} />
                  <div className="two-buttons"><button className="btn btn-small" onClick={() => updateDesign(cur => ({ ...cur, photoPanX: 0, photoPanY: 0, photoZoom: 1 }))}>사진 위치 초기화</button><button className="btn btn-small" onClick={removePhoto} disabled={!design.photoDataUrl}>사진 삭제</button></div>
                  <p className="subtle-note">사진 위를 드래그하면 프레임 안에서 위치를 조정할 수 있어요. 사진은 서버로 전송되지 않습니다.</p>
                </>}
                {currentLayer.type !== 'photo' && <>
                  <div className="form-row">
                    <div className="field"><label className="field-label">X 위치</label><input className="text-input" type="number" value={Math.round(currentLayer.x)} onChange={e => patchLayer(currentLayer.id, { x: Number(e.target.value) || 0 })} /></div>
                    <div className="field"><label className="field-label">Y 위치</label><input className="text-input" type="number" value={Math.round(currentLayer.y)} onChange={e => patchLayer(currentLayer.id, { y: Number(e.target.value) || 0 })} /></div>
                  </div>
                  <RangeControl label="요소 크기" value={currentLayer.scale} min={0.18} max={3.2} step={0.02} suffix="×" onChange={v => patchLayer(currentLayer.id, { scale: v })} />
                  <RangeControl label="회전" value={currentLayer.rotation} min={-180} max={180} step={1} suffix="°" onChange={v => patchLayer(currentLayer.id, { rotation: v })} />
                </>}
                {currentLayer.type === 'photo' && <RangeControl label="사진 기울이기" value={currentLayer.rotation} min={-20} max={20} step={1} suffix="°" onChange={v => patchLayer(currentLayer.id, { rotation: v })} />}
                {currentLayer.type === 'photoFrame' && <p className="subtle-note">액자 위치·크기·회전을 조정하면 사진 마스크도 함께 따라갑니다. 프레임 장식과 사진 자체는 별도 레이어예요.</p>}
                <div className="two-buttons"><button className="btn btn-small" onClick={() => patchLayer(currentLayer.id, { x: currentLayer.type === 'border' ? 200 : currentLayer.x, y: currentLayer.type === 'border' ? 400 : currentLayer.y, scale: 1, rotation: 0 })}>요소 변형 초기화</button><button className="btn btn-small" onClick={deleteSelected} disabled={currentLayer.type === 'border'}>⌫ 요소 삭제</button></div>
              </>}
            </section>

            <section className="section">
              <SectionTitle>컬러 팔레트</SectionTitle>
              <div className="preset-grid">{PRESETS.map(p => <button key={p.name} className="preset" onClick={() => applyPreset(p)}><span className="swatches">{p.swatches.map((s, i) => <i key={i} className="swatch" style={{ background: s }} />)}</span><span>{p.name}</span></button>)}</div>
            </section>

            <section className="section">
              <SectionTitle>독립 색상 설정</SectionTitle>
              <ColorControl label="티켓 바탕색" value={design.colors.paper} onChange={v => patchColors({ paper: v })} />
              <ColorControl label="외곽선 및 내부 테두리" value={design.colors.border} onChange={v => patchColors({ border: v })} />
              <ColorControl label="크리스마스 장식 기본색" value={design.colors.ornament} onChange={v => patchColors({ ornament: v })} />
              <ColorControl label="제목 글씨 색상" value={design.colors.title} onChange={v => patchColors({ title: v })} />
              <ColorControl label="예매자 이름 색상" value={design.colors.name} onChange={v => patchColors({ name: v })} />
              <ColorControl label="사진 액자 색상" value={design.colors.frame} onChange={v => patchColors({ frame: v })} />
              <ColorControl label="캔버스 배경색" value={design.colors.background} onChange={v => patchColors({ background: v })} />
              {currentLayer && canColorSelected && selectedLayerColorAllowed && <div style={{ paddingTop: 5 }}><ColorControl label={`선택 요소 색상 · ${currentLayer.label}`} value={selectedColor} onChange={changeSelectedColor} /></div>}
              <p className="subtle-note">선택 요소 색상은 장식·테두리·제목·이름·액자에 개별 적용됩니다. 프리셋을 다시 선택하면 장식은 프리셋 색으로 돌아갑니다.</p>
            </section>

            <section className="section">
              <SectionTitle>정사각형 캔버스</SectionTitle>
              <label className="check-label"><input type="checkbox" checked={design.transparentBg} onChange={e => updateDesign(cur => ({ ...cur, transparentBg: e.target.checked }))} /> 투명 배경 PNG로 저장</label>
              <p className="subtle-note">투명 배경을 켜면 캔버스 배경색은 다운로드에서 제외됩니다. 티켓 종이색은 그대로 유지돼요.</p>
            </section>
          </>}

          {activeTab === 'add' && <>
            <section className="section"><SectionTitle>텍스트 요소</SectionTitle><div className="add-grid">
              <button className="add-tile" onClick={() => addLayer('title')}><span className="add-symbol" style={{ fontStyle: 'italic' }}>Aa</span><span className="add-label">제목 추가</span></button>
              <button className="add-tile" onClick={() => addLayer('name')}><span className="add-symbol">T</span><span className="add-label">이름 추가</span></button>
              <button className="add-tile" onClick={() => { setSelectedId('photo'); setActiveTab('edit'); window.setTimeout(() => fileInputRef.current?.click(), 40); }}><span className="add-symbol">◎</span><span className="add-label">사진 업로드</span></button>
            </div></section>
            <section className="section"><SectionTitle>앤티크 장식 추가</SectionTitle><div className="add-grid">
              {([
                ['nutcracker', '병정', '♙'], ['bow', '리본', '♧'], ['holly', '홀리', '❧'], ['star', '별', '✦'], ['snowflake', '눈꽃', '❄'], ['bell', '방울', '♢'], ['laurel', '월계수', '❦'], ['curtain', '커튼', '⌁'], ['ribbon', '장식 띠', '〰'],
              ] as [OrnamentType, string, string][]).map(([type, label, glyph]) => <button key={type} className="add-tile" onClick={() => addLayer(type)}><span className="add-symbol">{glyph}</span><span className="add-label">{label}</span></button>)}
            </div><p className="subtle-note">추가한 장식은 레이어로 생성됩니다. 캔버스에서 드래그하거나 속성 편집에서 크기·회전·색상을 바꿔 보세요.</p></section>
            <section className="section"><SectionTitle>사진 프레임</SectionTitle><button className="btn" onClick={() => addLayer('photoFrame')}>◎ 타원형 메달리온 프레임 추가</button><p className="subtle-note">사진 레이어와 액자 레이어는 독립적입니다. 기존 액자는 레이어 패널에서 따로 선택할 수 있어요.</p></section>
          </>}

          {activeTab === 'layers' && <>
            <section className="section"><SectionTitle hint={`${design.layers.length + 1} layers`}>레이어 순서</SectionTitle><p className="subtle-note" style={{ marginTop: 0, marginBottom: 10 }}>위쪽에 있는 레이어가 앞에 표시됩니다. 행을 클릭해 선택하고 화살표로 순서를 바꾸세요.</p>
              <div className="layer-list">
                <button className={`layer-row ${selectedId === 'ticket' ? 'active' : ''}`} onClick={() => { setSelectedId('ticket'); setActiveTab('edit'); }}><span className="layer-icon">▤</span><span className="layer-name">티켓 전체<span className="layer-type">배경 · 크기 · 위치</span></span><span className="layer-actions"><span className="eyebrow">BASE</span></span></button>
                {displayLayers.map(layer => {
                  const index = design.layers.findIndex(l => l.id === layer.id);
                  return <div key={layer.id} className={`layer-row ${selectedId === layer.id ? 'active' : ''}`} style={{ paddingRight: 5 }}>
                    <button style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, border: 0, padding: 0, minWidth: 0, background: 'transparent', color: 'inherit', textAlign: 'left' }} onClick={() => { setSelectedId(layer.id); setActiveTab('edit'); }}><span className="layer-icon">{layerGlyph(layer)}</span><span className="layer-name">{layer.label}<span className="layer-type">{layer.type === 'ornament' ? 'SVG 장식' : layer.type === 'photoFrame' ? '메달리온 프레임' : layer.type === 'photo' ? '사진 마스크' : layer.type === 'border' ? '우표형 테두리' : layer.type === 'title' ? '제목 텍스트' : layer.type === 'name' ? '이름 텍스트' : '텍스트'}</span></span></button>
                    <span className="layer-actions"><button className="icon-btn" aria-label="앞으로 이동" title="앞으로" disabled={index === design.layers.length - 1} onClick={() => moveLayerOrder(layer.id, 1)}>↑</button><button className="icon-btn" aria-label="뒤로 이동" title="뒤로" disabled={index === 0} onClick={() => moveLayerOrder(layer.id, -1)}>↓</button></span>
                  </div>;
                })}
              </div>
            </section>
            <section className="section"><SectionTitle>선택 레이어 작업</SectionTitle><div className="two-buttons"><button className="btn btn-small" disabled={!currentLayer} onClick={() => currentLayer && moveLayerOrder(currentLayer.id, 1)}>↑ 앞으로 가져오기</button><button className="btn btn-small" disabled={!currentLayer || currentLayer.type === 'border'} onClick={deleteSelected}>⌫ 삭제</button></div><p className="subtle-note">실행 취소 / 다시 실행으로 변경한 디자인을 되돌릴 수 있습니다.</p></section>
          </>}
        </div>
      </aside>

      <section className="stage-card">
        <div className="stage-heading"><div><div className="eyebrow">Live canvas · 1:1 square</div><h2 className="stage-title">티켓 미리보기</h2><p className="stage-subtitle">선택한 레이어를 직접 끌어 배치하세요.</p></div><div className="stage-status"><span className="status-dot" /> 실시간 반영 <span>·</span> 1600 × 1600 PNG</div></div>
        <div className="stage-wrap"><div className={`artboard ${design.transparentBg ? 'transparent' : ''}`}>
          <ArtworkSvg design={design} selectedId={selectedId} editor svgRef={svgRef} onLayerPointerDown={onLayerPointerDown} onBackgroundPointerDown={() => setSelectedId(null)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
        </div></div>
        <div className="stage-footer"><div className="stage-tools"><button className="btn btn-small" onClick={centerTicket}>⊙ 티켓 중앙 정렬</button><button className="btn btn-small" onClick={() => setPreviewOpen(true)}>▧ 다운로드 전 미리보기</button><label className="check-label"><input type="checkbox" checked={design.transparentBg} onChange={e => updateDesign(cur => ({ ...cur, transparentBg: e.target.checked }))} /> 투명 배경</label></div><span className="kbd-hint">요소 선택 후 드래그 · 모서리 핸들로 크기 · 위 핸들로 회전</span></div>
      </section>
    </div>
    <div className="footer-note"><span>NOËL TICKET STUDIO · MADE FOR YOUR LITTLE WINTER STORY</span><span>모든 이미지 편집과 PNG 저장은 브라우저 안에서 처리됩니다.</span></div>

    {previewOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPreviewOpen(false); }}><section className="preview-modal" role="dialog" aria-modal="true" aria-label="다운로드 전 최종 미리보기"><div className="preview-modal-head"><div><div className="eyebrow">Final artwork</div><h2>다운로드 전 최종 미리보기</h2></div><button className="btn btn-small" onClick={() => setPreviewOpen(false)}>닫기 ×</button></div><div className="preview-canvas"><ArtworkSvg design={design} selectedId={null} editor={false} /></div><div className="preview-actions"><button className="btn" onClick={() => setPreviewOpen(false)}>계속 편집하기</button><button className="btn btn-primary" onClick={exportPng}>↓ 1600 × 1600 PNG 저장</button></div></section></div>}
    {toast && <div className="toast" role="status">✦ {toast}</div>}
  </main>;
}
