import { assert } from "./deps.ts";

export interface ClientInit {
  host: string;
  username?: string;
  password?: string;
}

export class Client {
  #username: string;
  #password: string;
  #baseURL: string;
  #cookie?: string;

  constructor(init: ClientInit) {
    this.#username = init.username ??
      Deno.env.get("ARUBAOS_USERNAME") ?? "admin";
    this.#password = init.password ??
      Deno.env.get("ARUBAOS_PASSWORD") ?? "";
    this.#baseURL = "https://" + init.host + ":4343/v1";
  }

  async request(path: string, init?: RequestInit): Promise<Response> {
    const url = new URL(this.#baseURL + path);
    url.searchParams.set("UIDARUBA", this.#cookie!);
    const request = new Request(url.toString(), init);
    request.headers.set("cookie", "SESSION=" + this.#cookie!);
    return await fetch(request);
  }

  async run(command: string): Promise<string> {
    const path = "/configuration/showcommand?command=" +
      encodeURIComponent(command);
    const response = await this.request(path);
    const body = await response.json();
    return body._data[0];
  }

  async login(): Promise<void> {
    const response = await this.request("/api/login", {
      method: "POST",
      body: new URLSearchParams({
        username: this.#username,
        password: this.#password,
      }),
    });
    const body = await response.json();
    assert(response.ok, "Login failed");
    this.#cookie = body._global_result.UIDARUBA;
  }

  async logout(): Promise<void> {
    const response = await this.request("/api/logout", {
      method: "POST",
    });
    await response.body?.cancel();
    assert(response.ok, "Logout failed");
    this.#cookie = undefined;
  }

  async requestOnce(path: string, init?: RequestInit): Promise<Response> {
    await this.login();
    const response = await this.request(path, init);
    await this.logout();
    return response;
  }

  async runOnce(command: string): Promise<string> {
    await this.login();
    const output = await this.run(command);
    await this.logout();
    return output;
  }
}

export async function requestOnce(
  clientInit: ClientInit,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const client = new Client(clientInit);
  return await client.requestOnce(path, init);
}

export async function runOnce(
  clientInit: ClientInit,
  command: string,
): Promise<string> {
  const client = new Client(clientInit);
  return await client.runOnce(command);
}
