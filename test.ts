import { runOnce } from "./mod.ts";
import { assert } from "./deps.ts";

//** All environmental variables need to be defined */
Deno.test("runOnce", async () => {
  const output = await runOnce({
    host: Deno.env.get("ARUBAOS_HOST")!,
  }, "show hostname");
  assert(output);
});
