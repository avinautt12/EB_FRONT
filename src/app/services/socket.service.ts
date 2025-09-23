import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment'; 

// @Injectable({
//   providedIn: 'root'
// })
// export class SocketService {
//   private socket: Socket;

//   constructor() {
//     this.socket = io(environment.apiUrl); 
//   }

//   listen(eventName: string) {
//     return new Promise<any>((resolve) => {
//       this.socket.on(eventName, (data) => {
//         resolve(data);
//       });
//     });
//   }

//   on<T>(eventName: string, callback: (data: T) => void) {
//     this.socket.on(eventName, callback);
//   }

//   emit(eventName: string, data: any) {
//     this.socket.emit(eventName, data);
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect();
//     }
//   }
// }
