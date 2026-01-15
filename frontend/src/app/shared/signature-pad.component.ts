import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signature-container">
      <div class="signature-header">
        <h4>Firmar Documento</h4>
        <p class="signature-hint">Use su dedo o mouse para firmar en el área blanca</p>
      </div>
      
      <div class="canvas-wrapper">
        <canvas 
          #canvas 
          (mousedown)="startDrawing($event)"
          (mousemove)="draw($event)"
          (mouseup)="stopDrawing()"
          (mouseleave)="stopDrawing()"
          (touchstart)="startDrawing($event)"
          (touchmove)="draw($event)"
          (touchend)="stopDrawing()">
        </canvas>
      </div>

      <div class="signature-actions">
        <button type="button" class="btn-secondary" (click)="clear()">
          🗑️ Limpiar
        </button>
        <button type="button" class="btn-secondary" (click)="cancel()">
          Cancelar
        </button>
        <button type="button" class="btn-primary" (click)="save()" [disabled]="isEmpty">
          ✓ Guardar Firma
        </button>
      </div>
    </div>
  `,
  styles: [`
    .signature-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .signature-header h4 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 18px;
    }

    .signature-hint {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .canvas-wrapper {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      overflow: hidden;
    }

    canvas {
      display: block;
      width: 100%;
      height: 200px;
      cursor: crosshair;
      touch-action: none;
    }

    .signature-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border-radius: 6px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }
  `]
})
export class SignaturePadComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureSaved = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  isEmpty = true;

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // Retina display
    canvas.height = 400;
    
    // Scale for retina
    this.ctx.scale(2, 2);
    
    // Configure drawing
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private getCoordinates(event: MouseEvent | TouchEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number;
    let clientY: number;
    
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    
    return {
      x: (clientX - rect.left),
      y: (clientY - rect.top)
    };
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDrawing = true;
    this.isEmpty = false;
    const coords = this.getCoordinates(event);
    this.ctx.beginPath();
    this.ctx.moveTo(coords.x, coords.y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    event.preventDefault();
    const coords = this.getCoordinates(event);
    this.ctx.lineTo(coords.x, coords.y);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clear() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.isEmpty = true;
  }

  save() {
    if (this.isEmpty) return;
    const canvas = this.canvasRef.nativeElement;
    const signature = canvas.toDataURL('image/png');
    this.signatureSaved.emit(signature);
  }

  cancel() {
    this.cancelled.emit();
  }
}
