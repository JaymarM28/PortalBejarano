import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  styles: [`
    .app-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      padding: 6px 0;
      font-size: 11px;
      color: #9ca3af;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(4px);
      z-index: 50;
      letter-spacing: 0.3px;
    }
    .app-footer span { font-weight: 600; color: #667eea; }
  `],
  template: `
    <router-outlet></router-outlet>
    <footer class="app-footer">By <span>JM AlphaTech</span></footer>
  `
})
export class AppComponent {
  title = 'Sistema de Pagos';
}
