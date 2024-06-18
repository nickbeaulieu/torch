import { parseArgs } from "util";

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function notImplemented(): never {
  throw new Error("Not implemented");
}

const args = parseArgs({
  args: Bun.argv,
  options: {
    flag1: {
      type: "boolean",
      short: "f",
    },
    flag2: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

export { assert, notImplemented, args };
