type FetchJsonResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function makeJsonResponse(payload: unknown, status = 200): FetchJsonResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

export function fetchMock(): jest.Mock {
  return global.fetch as jest.Mock;
}

export function mockFetchOk(payload: unknown, status = 200): void {
  fetchMock().mockResolvedValueOnce(makeJsonResponse(payload, status));
}

export function mockFetchHttpError(status = 500, payload: unknown = {}): void {
  fetchMock().mockResolvedValueOnce(makeJsonResponse(payload, status));
}

export function asMock<T extends (...args: any[]) => any>(value: T): jest.MockedFunction<T> {
  return value as jest.MockedFunction<T>;
}

export function silenceConsole(method: 'warn' | 'error' = 'warn'): jest.SpyInstance {
  return jest.spyOn(console, method).mockImplementation(() => undefined);
}
