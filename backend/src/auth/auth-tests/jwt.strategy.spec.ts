import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../jwt.strategy';

describe('JwtStrategy', () => {
    const originalJwtSecret = process.env.JWT_SECRET;

    const usersService = {
        findById: jest.fn(),
    };

    let strategy: JwtStrategy;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        strategy = new JwtStrategy(usersService as any);
    });

    afterAll(() => {
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
            return;
        }

        process.env.JWT_SECRET = originalJwtSecret;
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
