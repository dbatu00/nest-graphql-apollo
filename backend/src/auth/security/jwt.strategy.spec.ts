import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
    const createUsersService = () => ({
        findById: jest.fn(),
    });

    const createConfigService = () => ({
        getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws UnauthorizedException for non-access token type', async () => {
        const usersService = createUsersService();
        const strategy = new JwtStrategy(usersService as any, createConfigService() as any);

        await expect(strategy.validate({ sub: 1, type: 'refresh' })).rejects.toBeInstanceOf(UnauthorizedException);
        expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is not found', async () => {
        const usersService = createUsersService();
        usersService.findById.mockResolvedValue(null);
        const strategy = new JwtStrategy(usersService as any, createConfigService() as any);

        await expect(strategy.validate({ sub: 99, type: 'access' })).rejects.toBeInstanceOf(UnauthorizedException);
        expect(usersService.findById).toHaveBeenCalledWith(99);
    });

    it('returns user for valid access payload', async () => {
        const usersService = createUsersService();
        usersService.findById.mockResolvedValue({ id: 5, username: 'alice' });
        const strategy = new JwtStrategy(usersService as any, createConfigService() as any);

        await expect(strategy.validate({ sub: 5, type: 'access' })).resolves.toEqual({ id: 5, username: 'alice' });
    });
});
