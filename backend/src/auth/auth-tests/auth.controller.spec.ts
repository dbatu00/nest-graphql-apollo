import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../auth.controller';

function createResponseMock() {
    const response = {
        status: jest.fn(),
        type: jest.fn(),
        send: jest.fn(),
    };

    response.status.mockReturnValue(response);
    response.type.mockReturnValue(response);
    response.send.mockReturnValue(response);

    return response;
}

describe('AuthController', () => {
    const authService = {
        processVerificationLink: jest.fn(),
    };

    let controller: AuthController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new AuthController(authService as any);
    });

    it('throws when token is missing', async () => {
        const res = createResponseMock();

        await expect(controller.verifyEmailFromLink('', res as any)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('renders verified page when token verifies', async () => {
        const res = createResponseMock();
        authService.processVerificationLink.mockResolvedValue({ status: 'verified' });

        await controller.verifyEmailFromLink('ok-token', res as any);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.type).toHaveBeenCalledWith('html');
        expect(res.send).toHaveBeenCalled();
    });

    it('renders expired resent page when expired token triggers resend', async () => {
        const res = createResponseMock();
        authService.processVerificationLink.mockResolvedValue({ status: 'expired_resent' });

        await controller.verifyEmailFromLink('expired-token', res as any);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.type).toHaveBeenCalledWith('html');
        expect(res.send).toHaveBeenCalled();
    });

    it('renders throttled page when resend is throttled', async () => {
        const res = createResponseMock();
        authService.processVerificationLink.mockResolvedValue({ status: 'expired_throttled' });

        await controller.verifyEmailFromLink('throttle-token', res as any);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.type).toHaveBeenCalledWith('html');
        expect(res.send).toHaveBeenCalled();
    });

    it('renders invalid page for invalid tokens', async () => {
        const res = createResponseMock();
        authService.processVerificationLink.mockResolvedValue({ status: 'invalid' });

        await controller.verifyEmailFromLink('bad-token', res as any);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.type).toHaveBeenCalledWith('html');
        expect(res.send).toHaveBeenCalled();
    });
});
