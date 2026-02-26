import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../security/jwt.strategy';

describe('JwtStrategy', () => {
    const usersService = {
        findById: jest.fn(),
    };

    const configService = {
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    let strategy: JwtStrategy;

    beforeEach(() => {
        jest.clearAllMocks();
        configService.getOrThrow.mockReturnValue('test-secret');
        strategy = new JwtStrategy(usersService as any, configService as any);
    });

    it('returns user from validate when found', async () => {
        const user = { id: 1, username: 'deniz' };
        usersService.findById.mockResolvedValue(user);

        await expect(strategy.validate({ sub: 1 })).resolves.toBe(user as any);
        expect(usersService.findById).toHaveBeenCalledWith(1);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
        usersService.findById.mockResolvedValue(null);

        await expect(strategy.validate({ sub: 999 })).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('propagates usersService errors', async () => {
        usersService.findById.mockRejectedValue(new Error('db failed'));

        await expect(strategy.validate({ sub: 1 })).rejects.toThrow('db failed');
    });
});
