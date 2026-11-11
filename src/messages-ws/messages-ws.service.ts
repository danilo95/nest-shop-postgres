import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';

interface ConnectedClients {
  [id: string]: { socket: Socket; user: User };
}

@Injectable()
export class MessagesWsService {
  private connectedClients: ConnectedClients = {};

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async registerClient(client: Socket, userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('user nout found');
    }
    if (!user.isActive) {
      throw new Error('user not active');
    }

    this.checkUserConnection(user);
    this.connectedClients[client.id] = {
      socket: client,
      user: user,
    };
  }

  removeClient(id: string) {
    delete this.connectedClients[id];
  }

  getConnectedClients() {
    return Object.keys(this.connectedClients);
  }

  getUserFullNameBySocketId(socketId: string) {
    return this.connectedClients[socketId].user.fullName;
  }

  private checkUserConnection(user: User) {
    for (const clienid of Object.keys(this.connectedClients)) {
      const connectedClients = this.connectedClients[clienid];
      if (connectedClients.user.id === user.id) {
        connectedClients.socket.disconnect();
        break;
      }
    }
  }
}
