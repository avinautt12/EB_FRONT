import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-autoguardado-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './autoguardado-dialog.component.html',
  styleUrls: ['./autoguardado-dialog.component.css']
})
export class AutoguardadoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AutoguardadoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      titulo: string;
      mensaje: string;
    }
  ) { }

  // Método unificado para manejar el cierre
  retomar(): void {
    this.dialogRef.close(true); // true indica que se debe retomar
  }

  descartar(): void {
    this.dialogRef.close(false); // false indica que se debe descartar
  }
}