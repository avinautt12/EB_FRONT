import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmacion-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmacion-dialog.component.html',
  styleUrls: ['./confirmacion-dialog.component.css']
})
export class ConfirmacionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      titulo: string;
      mensaje: string;
      nivelCliente: string;
      precioCliente: number;
      precioPublico: number;
      compromisoCliente: number;
      totalBicicletas: number;
      totalProyeccion: number;
      detalles: Array<{
        producto: {
          clave_factura: string;
          descripcion: string;
        };
        precioUnitario: number;
        subtotal: number;
        q1_sep_2025: number;
        q2_sep_2025: number;
        q1_oct_2025: number;
        q2_oct_2025: number;
        q1_nov_2025: number;
        q2_nov_2025: number;
        q1_dic_2025: number;
        q2_dic_2025: number;
      }>;
    }
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}