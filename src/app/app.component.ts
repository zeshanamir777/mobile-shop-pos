import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Mobile Shop POS';
  error: string | null = null;

  ngOnInit() {
    // Check if Electron API is available
    if (typeof window !== 'undefined' && !window.electronAPI) {
      console.warn('Electron API not available - app may not work correctly');
    }
  }
}
