import { Point } from './MathUtils';

export interface FilterConfig { name: string; css: string; border: string; }

export const FILTERS: FilterConfig[] = [
  { name: 'Normal', css: 'none', border: 'rgba(255,255,255,0.8)' },
  { name: 'Dual Tone', css: 'contrast(1.5) sepia(1) hue-rotate(180deg) saturate(2)', border: 'rgba(0,255,255,0.8)' },
  { name: 'Thermal', css: 'invert(1) hue-rotate(240deg) saturate(3) contrast(1.2)', border: 'rgba(255,0,0,0.8)' },
  { name: 'Sketch', css: 'grayscale(1) contrast(3) brightness(1.2)', border: 'rgba(0,0,0,0.8)' },
  { name: 'Glitch', css: 'hue-rotate(90deg) saturate(3) contrast(2)', border: 'rgba(255,0,255,0.8)' }
];

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    // PERBAIKAN: Dibuat sangat standar agar TS DOM lib tidak melempar error
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Canvas 2D not supported");
    this.ctx = context;
  }

  render(video: HTMLVideoElement, width: number, height: number, portalMask: Point[] | null, filterIndex: number, isMirrored: boolean) {
    this.ctx.restore(); 
    this.ctx.save();
    
    if (isMirrored) {
      this.ctx.translate(width, 0);
      this.ctx.scale(-1, 1);
    }
    this.ctx.filter = 'none';
    this.ctx.drawImage(video, 0, 0, width, height);
    
    if (isMirrored) {
      this.ctx.scale(-1, 1);
      this.ctx.translate(-width, 0);
    }

    if (portalMask && portalMask.length > 2) {
      // PERF: hitung bounding box portal, lalu filter HANYA area itu (bukan full frame).
      // Ini mengurangi jumlah pixel yang diproses ctx.filter secara drastis (mis. dari
      // 1280x720 jadi ~ukuran tangan+padding), sumber lag terbesar sebelumnya.
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of portalMask) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const PAD = 24;
      const dx = Math.max(0, Math.floor(minX - PAD));
      const dy = Math.max(0, Math.floor(minY - PAD));
      const dw = Math.min(width, Math.ceil(maxX + PAD)) - dx;
      const dh = Math.min(height, Math.ceil(maxY + PAD)) - dy;

      if (dw > 0 && dh > 0) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(portalMask[0].x, portalMask[0].y);
        for (let i = 1; i < portalMask.length; i++) {
          this.ctx.lineTo(portalMask[i].x, portalMask[i].y);
        }
        this.ctx.closePath();
        this.ctx.clip();

        // Mirror dihitung manual lewat source-rect (bukan ctx.translate/scale) supaya
        // crop bounding-box tetap presisi 1:1 dengan area yang dikonsumsi filter.
        const sx = isMirrored ? (width - dx - dw) : dx;
        this.ctx.filter = FILTERS[filterIndex].css;
        this.ctx.drawImage(video, sx, dy, dw, dh, dx, dy, dw, dh);
        this.ctx.restore();
      }

      // Border glow: shadowBlur dihapus (operasi Canvas2D paling berat di HP,
      // terutama Android). Diganti stroke ganda (tebal+transparan di luar,
      // tipis+solid di dalam) — efek glow mirip, biaya jauh lebih murah.
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(portalMask[0].x, portalMask[0].y);
      for (let i = 1; i < portalMask.length; i++) {
        this.ctx.lineTo(portalMask[i].x, portalMask[i].y);
      }
      this.ctx.closePath();

      this.ctx.strokeStyle = FILTERS[filterIndex].border;
      this.ctx.globalAlpha = 0.25;
      this.ctx.lineWidth = 8;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.restore();
    }
    
    this.ctx.restore(); 
  }
}
