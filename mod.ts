export interface ClientInit {
  origin: string;
  version?: string;
  username?: string;
  password?: string;
}

export class Client {
  #origin: string;
  #version: string;
  #username: string;
  #password: string;
  #cookie?: string;

  constructor({ origin, version, username, password }: ClientInit) {
    this.#origin = origin;
    this.#version = version ?? "v1";
    this.#username = username ?? "admin";
    this.#password = password ?? "";
  }

  request(path: string, init?: RequestInit): Promise<Response> {
    const url = new URL(this.#origin + ":4343/" + this.#version + path);
    url.searchParams.append("UIDARUBA", this.#cookie!);
    const request = new Request(url.toString(), init);
    request.headers.set("cookie", "SESSION=" + this.#cookie!);
    return fetch(request);
  }

  async login(): Promise<void> {
    const response = await this.request("/api/login", {
      method: "POST",
      body: new URLSearchParams({
        username: this.#username,
        password: this.#password,
      }),
    });
    console.assert(response.ok, "Login failed");
    const { _global_result } = await response.json();
    this.#cookie = _global_result.UIDARUBA;
  }

  async logout(): Promise<void> {
    const response = await this.request("/api/logout", {
      method: "POST",
    });
    console.assert(response.ok, "Logout failed");
    this.#cookie = undefined;
  }
}

export async function request(
  clientInit: ClientInit,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const client = new Client(clientInit);
  await client.login();
  const response = await client.request(path, init);
  await client.logout();
  return response;
}
