import { $ } from 'bun'
import { generateC } from './src/codegen'
import { Lexer } from './src/lexer'
import { Parser } from './src/parser'
import { args } from './utils'

function usage() {
  console.log('Usage: torch <commmand> <file>')
  console.log('commands:')
  console.log('  run    <file> - compile & run the program')
  console.log('  build  <file> - compile the program')
}

if (args.positionals.length <= 2) {
  usage()
  process.exit(1)
}

if (args.positionals.length > 2) {
  const [, , command, file] = args.positionals
  // FIXME: adjust this for compiled run, when not running with bun...
  // console.log("args.positionals:", args.positionals);
  switch (command) {
    case 'run':
      const code = await Bun.file(file).text()
      const lexer = new Lexer()
      const tokens = lexer.tokenize(code)
      const parser = new Parser(tokens)
      const statements = parser.parse()
      generateC(statements)
      await $`gcc -o output output.c`
      await $`./output`
      break
    default:
      console.error(`Unknown command: ${command}`)
      usage()
      process.exit(1)
  }
}
