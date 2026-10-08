import {
    GraphQLRequestError,
    graphqlFetch,
    isAuthGraphQLError,
    registerAuthFailureHandler,
} from '../../utils/graphqlFetch';
import { getToken } from '../../utils/token';

jest.mock('../../utils/token', () => ({
    getToken: jest.fn(),
}));

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('graphqlFetch', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('successful requests', () => {
        it('returns GraphQL data', async () => {
            mockedGetToken.mockResolvedValue('jwt-123');

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: {
                        me: {
                            id: 12,
                            username: 'alice',
                        },
                    },
                }),
            });

            const result = await graphqlFetch<{
                me: {
                    id: number;
                    username: string;
                };
            }>('query Me { me { id username } }');

            expect(result).toEqual({
                me: {
                    id: 12,
                    username: 'alice',
                },
            });
        });

        it('sends the GraphQL query and variables in the request body', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: { user: { id: '123' } },
                }),
            });

            const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
          }
        }
      `;

            const variables = {
                id: '123',
            };

            await graphqlFetch(query, variables);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        query,
                        variables,
                    }),
                }),
            );
        });

        it('uses an empty variables object by default', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: { me: null },
                }),
            });

            const query = 'query { me { id } }';

            await graphqlFetch(query);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: JSON.stringify({
                        query,
                        variables: {},
                    }),
                }),
            );
        });
    });

    describe('authentication headers', () => {
        it('adds the bearer token when a token exists', async () => {
            mockedGetToken.mockResolvedValue('jwt-123');

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: { me: { id: 1 } },
                }),
            });

            await graphqlFetch('query { me { id } }');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer jwt-123',
                    }),
                }),
            );
        });

        it('does not add an authorization header when no token exists', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: { me: null },
                }),
            });

            await graphqlFetch('query { me { id } }');

            const [, options] = (global.fetch as jest.Mock).mock.calls[0];

            expect(options.headers).toEqual({
                'Content-Type': 'application/json',
            });
        });

        it('allows custom headers to be added', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: { me: null },
                }),
            });

            await graphqlFetch(
                'query { me { id } }',
                {},
                {
                    headers: {
                        'X-Test-Header': 'test-value',
                    },
                },
            );

            const [, options] = (global.fetch as jest.Mock).mock.calls[0];

            expect(options.headers).toEqual({
                'Content-Type': 'application/json',
                'X-Test-Header': 'test-value',
            });
        });

        it('allows custom headers to override existing headers', async () => {
            mockedGetToken.mockResolvedValue('jwt-123');

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: { me: null },
                }),
            });

            await graphqlFetch(
                'query { me { id } }',
                {},
                {
                    headers: {
                        Authorization: 'Custom authorization',
                    },
                },
            );

            const [, options] = (global.fetch as jest.Mock).mock.calls[0];

            expect(options.headers.Authorization).toBe('Custom authorization');
        });
    });

    describe('HTTP errors', () => {
        it('throws GraphQLRequestError for a non-2xx response', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500,
                json: jest.fn(),
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toMatchObject({
                name: 'GraphQLRequestError',
                message: 'HTTP request failed (500)',
                status: 500,
                errors: [],
            });
        });

        it('does not attempt to parse JSON when the HTTP response is not ok', async () => {
            mockedGetToken.mockResolvedValue(null);

            const json = jest.fn();

            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json,
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toBeInstanceOf(GraphQLRequestError);

            expect(json).not.toHaveBeenCalled();
        });

        it('preserves the HTTP status on the GraphQLRequestError', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 403,
                json: async () => ({}),
            });

            try {
                await graphqlFetch('query { me { id } }');
                throw new Error('Expected graphqlFetch to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(GraphQLRequestError);

                const requestError = error as GraphQLRequestError;

                expect(requestError.status).toBe(403);
            }
        });
    });

    describe('GraphQL errors', () => {
        it('throws GraphQLRequestError when GraphQL returns errors', async () => {
            mockedGetToken.mockResolvedValue(null);

            const errors = [
                {
                    message: 'Bad input',
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                },
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    errors,
                }),
            });

            try {
                await graphqlFetch('query { me { id } }');
                throw new Error('Expected graphqlFetch to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(GraphQLRequestError);

                const requestError = error as GraphQLRequestError;

                expect(requestError.message).toBe('Bad input');
                expect(requestError.errors).toEqual(errors);
                expect(requestError.status).toBe(200);
            }
        });

        it('uses a fallback message when the GraphQL error has no message', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    errors: [
                        {
                            extensions: {
                                code: 'INTERNAL_SERVER_ERROR',
                            },
                        },
                    ],
                }),
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toMatchObject({
                message: 'GraphQL request failed',
            });
        });

        it('preserves partial data when GraphQL returns both data and errors before throwing', async () => {
            mockedGetToken.mockResolvedValue(null);

            const errors = [
                {
                    message: 'Something went wrong',
                },
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: {
                        me: null,
                    },
                    errors,
                }),
            });

            try {
                await graphqlFetch('query { me { id } }');
                throw new Error('Expected graphqlFetch to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(GraphQLRequestError);
                expect((error as GraphQLRequestError).errors).toEqual(errors);
            }
        });

        it('throws when the GraphQL response contains neither data nor errors', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toMatchObject({
                message: 'GraphQL response did not include data',
            });
        });

        it('throws when the GraphQL response is not an object', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => null,
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toMatchObject({
                message: 'Invalid GraphQL response format',
            });
        });

        it('accepts a valid response with null data', async () => {
            mockedGetToken.mockResolvedValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    data: null,
                }),
            });

            const result = await graphqlFetch<null>('query { me { id } }');

            expect(result).toBeNull();
        });
    });

    describe('network and parsing errors', () => {
        it('rethrows a network error from fetch', async () => {
            mockedGetToken.mockResolvedValue(null);

            const networkError = new Error('Network failure');

            global.fetch = jest.fn().mockRejectedValue(networkError);

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toBe(networkError);
        });

        it('rethrows an error when response.json() fails', async () => {
            mockedGetToken.mockResolvedValue(null);

            const parseError = new Error('Invalid JSON');

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockRejectedValue(parseError),
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toBe(parseError);
        });
    });

    describe('authentication failure handling', () => {
        it('calls the registered auth failure handler for UNAUTHENTICATED', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue('jwt');

                global.fetch = jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        errors: [
                            {
                                message: 'Not authenticated',
                                extensions: {
                                    code: 'UNAUTHENTICATED',
                                },
                            },
                        ],
                    }),
                });

                await expect(
                    graphqlFetch('query { me { id } }'),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(handler).toHaveBeenCalledTimes(1);
                expect(handler).toHaveBeenCalledWith(expect.any(GraphQLRequestError));
            } finally {
                unregister();
            }
        });

        it('calls the auth failure handler for FORBIDDEN', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue('jwt');

                global.fetch = jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        errors: [
                            {
                                message: 'Forbidden',
                                extensions: {
                                    code: 'FORBIDDEN',
                                },
                            },
                        ],
                    }),
                });

                await expect(
                    graphqlFetch('query { me { id } }'),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(handler).toHaveBeenCalledTimes(1);
            } finally {
                unregister();
            }
        });

        it('calls the auth failure handler for an HTTP 401', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue('jwt');

                global.fetch = jest.fn().mockResolvedValue({
                    ok: false,
                    status: 401,
                    json: async () => ({}),
                });

                await expect(
                    graphqlFetch('query { me { id } }'),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(handler).toHaveBeenCalledTimes(1);
            } finally {
                unregister();
            }
        });

        it('calls the auth failure handler for an HTTP 403', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue('jwt');

                global.fetch = jest.fn().mockResolvedValue({
                    ok: false,
                    status: 403,
                    json: async () => ({}),
                });

                await expect(
                    graphqlFetch('query { me { id } }'),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(handler).toHaveBeenCalledTimes(1);
            } finally {
                unregister();
            }
        });

        it('recognizes authentication errors from their message', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue('jwt');

                global.fetch = jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        errors: [
                            {
                                message: 'JWT token is invalid',
                            },
                        ],
                    }),
                });

                await expect(
                    graphqlFetch('query { me { id } }'),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(handler).toHaveBeenCalledTimes(1);
            } finally {
                unregister();
            }
        });

        it('does not call the auth failure handler for ordinary GraphQL errors', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue(null);

                global.fetch = jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        errors: [
                            {
                                message: 'Post not found',
                                extensions: {
                                    code: 'NOT_FOUND',
                                },
                            },
                        ],
                    }),
                });

                await expect(
                    graphqlFetch('query { post { id } }'),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(handler).not.toHaveBeenCalled();
            } finally {
                unregister();
            }
        });

        it('does not call the auth failure handler when skipAuthFailureHandler is true', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue('jwt');

                global.fetch = jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        errors: [
                            {
                                message: 'Unauthorized',
                                extensions: {
                                    code: 'UNAUTHENTICATED',
                                },
                            },
                        ],
                    }),
                });

                await expect(
                    graphqlFetch(
                        'query { me { id } }',
                        {},
                        { skipAuthFailureHandler: true },
                    ),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(handler).not.toHaveBeenCalled();
            } finally {
                unregister();
            }
        });

        it('awaits an async auth failure handler before rethrowing', async () => {
            const events: string[] = [];

            const handler = jest.fn(async () => {
                events.push('handler-start');

                await Promise.resolve();

                events.push('handler-end');
            });

            const unregister = registerAuthFailureHandler(handler);

            try {
                mockedGetToken.mockResolvedValue('jwt');

                global.fetch = jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        errors: [
                            {
                                message: 'Unauthorized',
                                extensions: {
                                    code: 'UNAUTHENTICATED',
                                },
                            },
                        ],
                    }),
                });

                await expect(
                    graphqlFetch('query { me { id } }'),
                ).rejects.toBeInstanceOf(GraphQLRequestError);

                expect(events).toEqual([
                    'handler-start',
                    'handler-end',
                ]);
            } finally {
                unregister();
            }
        });

        it('does not invoke a handler after it has been unregistered', async () => {
            const handler = jest.fn();
            const unregister = registerAuthFailureHandler(handler);

            unregister();

            mockedGetToken.mockResolvedValue('jwt');

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    errors: [
                        {
                            message: 'Unauthorized',
                            extensions: {
                                code: 'UNAUTHENTICATED',
                            },
                        },
                    ],
                }),
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toBeInstanceOf(GraphQLRequestError);

            expect(handler).not.toHaveBeenCalled();
        });

        it('does not let an old unregister function remove a newer handler', async () => {
            const firstHandler = jest.fn();
            const secondHandler = jest.fn();

            const unregisterFirst = registerAuthFailureHandler(firstHandler);

            registerAuthFailureHandler(secondHandler);

            // This should only remove the handler if it is still the first handler.
            unregisterFirst();

            mockedGetToken.mockResolvedValue('jwt');

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    errors: [
                        {
                            message: 'Unauthorized',
                            extensions: {
                                code: 'UNAUTHENTICATED',
                            },
                        },
                    ],
                }),
            });

            await expect(
                graphqlFetch('query { me { id } }'),
            ).rejects.toBeInstanceOf(GraphQLRequestError);

            expect(firstHandler).not.toHaveBeenCalled();
            expect(secondHandler).toHaveBeenCalledTimes(1);

            registerAuthFailureHandler(null);
        });
    });
});

describe('GraphQLRequestError', () => {
    it('sets the error name, message, errors, and status', () => {
        const errors = [
            {
                message: 'Bad input',
                extensions: {
                    code: 'BAD_USER_INPUT',
                },
            },
        ];

        const error = new GraphQLRequestError(
            'Bad input',
            errors,
            400,
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('GraphQLRequestError');
        expect(error.message).toBe('Bad input');
        expect(error.errors).toEqual(errors);
        expect(error.status).toBe(400);
    });

    it('uses default values', () => {
        const error = new GraphQLRequestError('Something failed');

        expect(error.errors).toEqual([]);
        expect(error.status).toBe(200);
    });
});

describe('isAuthGraphQLError', () => {
    describe('GraphQLRequestError', () => {
        it.each([401, 403])(
            'returns true for HTTP status %s',
            (status) => {
                const error = new GraphQLRequestError(
                    'Request failed',
                    [],
                    status,
                );

                expect(isAuthGraphQLError(error)).toBe(true);
            },
        );

        it.each([
            'UNAUTHENTICATED',
            'unauthenticated',
            'FORBIDDEN',
            'forbidden',
        ])('returns true for auth GraphQL code %s', (code) => {
            const error = new GraphQLRequestError(
                'Request failed',
                [
                    {
                        extensions: {
                            code,
                        },
                    },
                ],
                200,
            );

            expect(isAuthGraphQLError(error)).toBe(true);
        });

        it.each([
            'Unauthorized',
            'UNAUTHORIZED',
            'Access denied: forbidden',
            'Invalid token',
            'JWT expired',
            'jwt is malformed',
        ])('returns true for auth-related message: %s', (message) => {
            const error = new GraphQLRequestError(
                message,
                [{ message }],
                200,
            );

            expect(isAuthGraphQLError(error)).toBe(true);
        });

        it('returns false for an ordinary GraphQL error', () => {
            const error = new GraphQLRequestError(
                'Post not found',
                [
                    {
                        message: 'Post not found',
                        extensions: {
                            code: 'NOT_FOUND',
                        },
                    },
                ],
                200,
            );

            expect(isAuthGraphQLError(error)).toBe(false);
        });

        it('returns false for an unrelated HTTP status', () => {
            const error = new GraphQLRequestError(
                'Internal server error',
                [],
                500,
            );

            expect(isAuthGraphQLError(error)).toBe(false);
        });
    });

    describe('ordinary Error', () => {
        it.each([
            'Unauthorized',
            'Forbidden',
            'Invalid token',
            'JWT expired',
            'jwt malformed',
        ])('returns true for auth-related message: %s', (message) => {
            expect(isAuthGraphQLError(new Error(message))).toBe(true);
        });

        it('returns false for an ordinary Error', () => {
            expect(
                isAuthGraphQLError(new Error('Database unavailable')),
            ).toBe(false);
        });
    });

    describe('non-errors', () => {
        it.each([
            null,
            undefined,
            'Unauthorized',
            401,
            {},
            [],
        ])('returns false for %p', (value) => {
            expect(isAuthGraphQLError(value)).toBe(false);
        });
    });

    it('returns false for a GraphQLRequestError with no errors and no auth status', () => {
        const error = new GraphQLRequestError(
            'Something went wrong',
            [],
            200,
        );

        expect(isAuthGraphQLError(error)).toBe(false);
    });

    it('checks all GraphQL errors rather than only the first one', () => {
        const error = new GraphQLRequestError(
            'Multiple errors',
            [
                {
                    message: 'Some unrelated problem',
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                },
                {
                    message: 'Unauthorized',
                    extensions: {
                        code: 'UNAUTHENTICATED',
                    },
                },
            ],
            200,
        );

        expect(isAuthGraphQLError(error)).toBe(true);
    });
});

describe('registerAuthFailureHandler', () => {
    afterEach(() => {
        registerAuthFailureHandler(null);
    });

    it('registers a handler', async () => {
        const handler = jest.fn();

        registerAuthFailureHandler(handler);

        mockedGetToken.mockResolvedValue('jwt');

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                errors: [
                    {
                        message: 'Unauthorized',
                        extensions: {
                            code: 'UNAUTHENTICATED',
                        },
                    },
                ],
            }),
        });

        await expect(
            graphqlFetch('query { me { id } }'),
        ).rejects.toBeInstanceOf(GraphQLRequestError);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('can clear the handler by registering null', async () => {
        const handler = jest.fn();

        registerAuthFailureHandler(handler);
        registerAuthFailureHandler(null);

        mockedGetToken.mockResolvedValue('jwt');

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                errors: [
                    {
                        message: 'Unauthorized',
                        extensions: {
                            code: 'UNAUTHENTICATED',
                        },
                    },
                ],
            }),
        });

        await expect(
            graphqlFetch('query { me { id } }'),
        ).rejects.toBeInstanceOf(GraphQLRequestError);

        expect(handler).not.toHaveBeenCalled();
    });
});