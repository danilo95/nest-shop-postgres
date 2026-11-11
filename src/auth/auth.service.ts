import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { RefreshToken } from './entities/refresh-token.entity.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });
      await this.userRepository.save(user);

      return this.createSession(user);
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true, fullName: true, roles: true, isActive: true },
    });

    if (!user || !user.isActive || !bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('credentials are not valid');
    }

    return this.createSession(user);
  }

  private async createSession({ id, email, fullName, roles }: User) {
    return { id, email, fullName, roles, ...(await this.issueTokens(id)) };
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign({ ...payload, type: 'access' });
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(userId: string) {
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      user: { id: userId },
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      token: this.getJwtToken({ id: userId }),
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const refreshTokenEntity = await this.refreshTokenRepository.findOne({
        where: { tokenHash: this.hashRefreshToken(token) },
        relations: { user: true },
      });

      if (!refreshTokenEntity) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (
        refreshTokenEntity.revokedAt ||
        refreshTokenEntity.expiresAt.getTime() <= Date.now()
      ) {
        throw new UnauthorizedException('Refresh token is revoked or expired');
      }

      if (!refreshTokenEntity.user.isActive) {
        throw new UnauthorizedException('User not active');
      }

      refreshTokenEntity.revokedAt = new Date();
      await this.refreshTokenRepository.save(refreshTokenEntity);

      return this.createSession(refreshTokenEntity.user);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async logout(token: string) {
    const refreshTokenEntity = await this.refreshTokenRepository.findOneBy({
      tokenHash: this.hashRefreshToken(token),
    });

    if (refreshTokenEntity && !refreshTokenEntity.revokedAt) {
      refreshTokenEntity.revokedAt = new Date();
      await this.refreshTokenRepository.save(refreshTokenEntity);
    }

    return { message: 'Session closed' };
  }

  private handleDBErrors(error: unknown) {
    if (
      error instanceof QueryFailedError &&
      error.driverError?.code === '23505'
    ) {
      throw new BadRequestException(error.driverError.detail);
    }

    this.logger.error(error instanceof Error ? error.stack : String(error));
    throw new InternalServerErrorException(
      'unexpected error check the server log',
    );
  }
}
