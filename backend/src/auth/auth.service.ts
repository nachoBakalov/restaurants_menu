import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma, SubscriptionStatus, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { JwtPayload } from './strategies/jwt.strategy';

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    restaurantId: string | null;
  };
};

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '30d';
  private readonly refreshTokenTtlMs = 30 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerOwner(dto: RegisterOwnerDto): Promise<AuthResult> {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingSlug = await this.prisma.restaurant.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 14 * 24 * 60 * 60 * 1000);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const basicPlan = await tx.plan.upsert({
          where: { key: 'BASIC' },
          update: { name: 'Basic' },
          create: { key: 'BASIC', name: 'Basic' },
        });

        const orderingFeature = await tx.feature.upsert({
          where: { key: 'ORDERING' },
          update: {},
          create: { key: 'ORDERING' },
        });

        await tx.planFeature.upsert({
          where: {
            planId_featureId: {
              planId: basicPlan.id,
              featureId: orderingFeature.id,
            },
          },
          update: {},
          create: {
            planId: basicPlan.id,
            featureId: orderingFeature.id,
          },
        });

        const restaurant = await tx.restaurant.create({
          data: {
            name: dto.restaurantName,
            slug: dto.slug,
          },
        });

        const owner = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            role: UserRole.OWNER,
            restaurantId: restaurant.id,
          },
        });

        await tx.subscription.create({
          data: {
            restaurantId: restaurant.id,
            planId: basicPlan.id,
            status: SubscriptionStatus.TRIAL,
            startsAt,
            endsAt,
          },
        });

        return owner;
      });

      return this.issueTokensForUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or slug already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokensForUser(user);
  }

  async refresh(dto: RefreshDto): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const now = new Date();

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    let matchingTokenId: string | null = null;
    for (const storedToken of storedTokens) {
      const matches = await bcrypt.compare(dto.refreshToken, storedToken.tokenHash);
      if (matches) {
        matchingTokenId = storedToken.id;
        break;
      }
    }

    if (!matchingTokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user);
    const newTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const refreshExpiresAt = new Date(Date.now() + this.refreshTokenTtlMs);

    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({ where: { id: matchingTokenId } }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt: refreshExpiresAt,
        },
      }),
    ]);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  private async issueTokensForUser(user: User): Promise<AuthResult> {
    const tokens = await this.generateTokens(user);
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const refreshExpiresAt = new Date(Date.now() + this.refreshTokenTtlMs);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.accessTokenExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.refreshTokenExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    };
  }
}
