describe('main bootstrap', () => {
    const originalPort = process.env.PORT;

    const flushMicrotasks = async () => {
        await Promise.resolve();
        await Promise.resolve();
    };

    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
        jest.clearAllMocks();

        if (originalPort === undefined) {
            delete process.env.PORT;
        } else {
            process.env.PORT = originalPort;
        }
    });

    it('creates app, enables cors, and listens on configured port', async () => {
        process.env.PORT = '4555';

        const enableCors = jest.fn();
        const listen = jest.fn().mockResolvedValue(undefined);
        const get = jest.fn().mockReturnValue({
            get: (key: string) => {
                if (key === 'PORT') {
                    return 4555;
                }

                if (key === 'CORS_ORIGINS') {
                    return ['http://localhost:19006'];
                }

                return undefined;
            },
        });
        const create = jest.fn().mockResolvedValue({ enableCors, listen, get });

        jest.doMock('@nestjs/core', () => ({
            NestFactory: { create },
        }));

        jest.isolateModules(() => {
            require('../main');
        });

        await flushMicrotasks();

        expect(create).toHaveBeenCalledTimes(1);
        expect(enableCors).toHaveBeenCalledTimes(1);
        expect(enableCors).toHaveBeenCalledWith({
            origin: ['http://localhost:19006'],
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        expect(listen).toHaveBeenCalledWith(4555);
    });

    it('logs and exits when bootstrap fails', async () => {
        const create = jest.fn().mockRejectedValue(new Error('bootstrap failed'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const exitSpy = jest
            .spyOn(process, 'exit')
            .mockImplementation(((_code?: number) => undefined) as never);

        jest.doMock('@nestjs/core', () => ({
            NestFactory: { create },
        }));

        jest.isolateModules(() => {
            require('../main');
        });

        await flushMicrotasks();

        expect(errorSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
