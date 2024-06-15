import { args, assert, notImplemented } from "./utils";
import { $ } from "bun";

enum Op {
  Push,
  Plus,
  Minus,
  Dump,
}

type Program = readonly [Op, ...number[]][];

function push(a: number) {
  return [Op.Push, a] as const;
}

function plus() {
  return [Op.Plus] as const;
}

function minus() {
  return [Op.Minus] as const;
}

function dump() {
  return [Op.Dump] as const;
}

function simulate(program: Program) {
  const stack: number[] = [];
  for (const op of program) {
    switch (op[0]) {
      case Op.Push:
        stack.push(op[1]);
        break;
      case Op.Plus: {
        const a = stack.pop();
        const b = stack.pop();
        if (a === undefined || b === undefined)
          throw new Error("Stack underflow");
        stack.push(a + b);
        break;
      }
      case Op.Minus: {
        const a = stack.pop();
        const b = stack.pop();
        if (a === undefined || b === undefined)
          throw new Error("Stack underflow");
        stack.push(b - a);
        break;
      }
      case Op.Dump: {
        const a = stack.pop();
        if (a === undefined) throw new Error("Stack underflow");
        console.log(a);
        break;
      }
      default:
        assert(false, "unreachable");
    }
  }
  assert(stack.length === 0, "Stack not empty");
}

async function compile(program: Program) {
  await $`nasm -f test.asm`;
  await $`ld -o test test.o`;
}

const program = [
  push(30),
  push(38),
  plus(),
  dump(),
  push(419),
  dump(),
  push(500),
  push(401),
  minus(),
  dump(),
] as unknown as Program;

function usage() {
  console.log("Usage: torch <commmand> <file>");
  console.log("commands:");
  console.log("  run <file> - interpret the program");
  console.log("  lit <file> - compile & run the program");
}

if (args.positionals.length <= 2) {
  usage();
  process.exit(1);
}

if (args.positionals.length > 2) {
  const [, , command, file] = args.positionals;
  switch (command) {
    case "run":
      simulate(program);
      break;
    case "lit":
      await compile(program);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      usage();
      process.exit(1);
  }
}

// await Bun.write("./test.txt", "Hello, World!");
