import { $ } from 'bun'
import { generateC } from './src/codegen'
import { tokenize } from './src/lexer'
import { parse } from './src/parser'
import { typecheck } from './src/typecheck'
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
      const tokens = tokenize(code)
      // console.log('tokens\n', tokens.map((t) => t.toString()).join('\n'))
      const statements = parse(tokens)
      typecheck(statements)
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
