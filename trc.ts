import { args } from "./utils";
import { Lexer } from "./src/lexer";

function usage() {
  console.log("Usage: torch <commmand> <file>");
  console.log("commands:");
  console.log("  run    <file> - compile & run the program");
  console.log("  build  <file> - compile the program");
}

if (args.positionals.length <= 2) {
  usage();
  process.exit(1);
}

if (args.positionals.length > 2) {
  const [, , command, file] = args.positionals;
  switch (command) {
    case "run":
      const lexer = new Lexer();
      const tokens = lexer.tokenize(
        'func main() -> int {\n\tprint("hello, world!")\n}'
      );
      console.log(
        "tokens:\n------\n" + tokens.map((x) => x.toString()).join("\n")
      );
      break;
    default:
      console.error(`Unknown command: ${command}`);
      usage();
      process.exit(1);
  }
}
