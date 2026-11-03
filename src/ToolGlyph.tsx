/** Small drawing of a technique's selection tool: ray, cone, volume, point, image plane or other. */
export default function ToolGlyph({ tool, size = 20 }: { tool?: string; size?: number }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  let body;
  switch (tool) {
    case 'ray':
      body = (<><circle cx="4" cy="16" r="2" fill="currentColor" /><path d="M5.5 14.5 17 3" {...s} /><circle cx="17" cy="3" r="1.4" fill="currentColor" /></>);
      break;
    case 'cone':
      body = (<><circle cx="4" cy="16" r="2" fill="currentColor" /><path d="M5 15 18 3.5M5 15 16.5 18.5" {...s} /><path d="M18 3.5Q20 12 16.5 18.5" {...s} /></>);
      break;
    case 'volume':
      body = (<><circle cx="10" cy="10" r="7.5" {...s} /><circle cx="8" cy="9" r="1.2" fill="currentColor" /><circle cx="12.5" cy="12" r="1.2" fill="currentColor" /></>);
      break;
    case 'point':
      body = (<><circle cx="10" cy="10" r="3.2" fill="currentColor" /><circle cx="10" cy="10" r="7" {...s} strokeDasharray="2 2.4" /></>);
      break;
    case 'image-plane':
      body = (<><rect x="3" y="3" width="14" height="14" rx="0.5" {...s} /><circle cx="10" cy="10" r="2" fill="currentColor" /></>);
      break;
    default:
      body = <path d="M10 2.5 17.5 10 10 17.5 2.5 10Z" {...s} />;
  }
  return (
    <svg className="tool-glyph" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      {body}
    </svg>
  );
}
