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
  let output = "";
  output += "#include <stdio.h>\n";
  output += "#include <stdlib.h>\n";
  output += "#include <stdint.h>\n";
  output += "#include <unistd.h>\n";
  output += "\n";
  output += "#define SIZE 1024\n";

  output += "int top = -1;\n";
  output += "uint64_t inp_array[SIZE];\n";
  output += "void push(uint64_t n);\n";
  output += "uint64_t pop();\n";

  output += "void dump(uint64_t n) {\n";
  output += '  printf("%llu\\n", n);\n';
  output += "}\n";

  output += "int main() {\n";
  output += "uint64_t a, b;\n";

  for (const op of program) {
    switch (op[0]) {
      case Op.Push:
        output += `  // -- push ${op[1]} --\n`;
        output += `  push(${op[1]});\n`;
        break;
      case Op.Plus:
        output += "  // -- plus --\n";
        output += "  a = pop();\n";
        output += "  b = pop();\n";
        output += "  push(a + b);\n";
        break;
      case Op.Minus:
        output += "  // -- minus --\n";
        output += "  a = pop();\n";
        output += "  b = pop();\n";
        output += "  push(b - a);\n";
        break;
      case Op.Dump:
        output += "  // -- dump --\n";
        output += "  a = pop();\n";
        output += "  dump(a);\n";
        break;
      default:
        notImplemented();
    }
  }

  output += "  return 0;\n";
  output += "}\n";

  output += "void push(uint64_t n) {\n";
  output += "  int x;\n";
  output += "  if (top == SIZE - 1) {\n";
  output += '    printf("\\nOverflow!!");\n';
  output += "  }\n";
  output += "  else {\n";
  output += "    x = n;\n";
  output += "    top = top + 1;\n";
  output += "    inp_array[top] = x;\n";
  output += "  }\n";
  output += "}\n";
  output += "\n";
  output += "uint64_t pop() {\n";
  output += "  if (top == -1) {\n";
  output += '    printf("\\nUnderflow!!");\n';
  output += "    return 0;\n";
  output += "  }\n";
  output += "  else {\n";
  output += "    return inp_array[top--];\n";
  output += "  }\n";
  output += "}\n";

  await Bun.write("output.c", output);
  await $`gcc -o output output.c`;
  await $`./output`;
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
