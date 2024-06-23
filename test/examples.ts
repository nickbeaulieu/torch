import { $ } from 'bun'
import * as fs from 'fs'
import * as path from 'path'
import { assert } from '../utils'

const expectPrefix = '/// Expect: "'
const errorPrefix = '/// Error: "'

const getSubstring = (contents: string, prefix: string) => {
  const startOfOutput = contents.indexOf(prefix) + prefix.length
  if (!startOfOutput) return ''
  const endOfOutput = contents.indexOf('"', startOfOutput)
  return contents.slice(startOfOutput, endOfOutput).replaceAll('\\n', '\n')
}

const compileAndRun = async (file: string, contents: string) => {
  const expectedOutput = getSubstring(contents, expectPrefix)
  const errorOutput = getSubstring(contents, errorPrefix).trim()

  let shelled
  if (errorOutput) {
    shelled = await $`bun run ./trc.ts run ${file}`.throws(false).quiet()
  } else {
    shelled = await $`bun run ./trc.ts run ${file}`.quiet()
  }

  const output = shelled.stdout.toString()
  const error = shelled.stderr.toString()
  if (error) console.warn('error:', error)

  if (errorOutput) {
    assert(
      output === errorOutput,
      `Expected error output to be: "${errorOutput}".\n ---- \nGot: "${output}"`,
    )
  } else {
    assert(
      output === expectedOutput,
      `Expected output to be: "${expectedOutput}".\n ---- \nGot: "${output}"`,
    )
  }
}

const examplesDir = './examples'

const files = await fs.promises.readdir(examplesDir, { withFileTypes: true })

for (const file of files) {
  await processFile(file)
}

async function processFile(file: fs.Dirent): Promise<void> {
  if (file.isDirectory()) {
    const files = await fs.promises.readdir(
      path.join(file.parentPath, file.name),
      {
        withFileTypes: true,
      },
    )

    for (const file of files) {
      await processFile(file)
    }
    return
  }

  const filePath = path.join(file.parentPath, file.name)
  const content = await fs.promises.readFile(filePath, 'utf8')
  try {
    console.info(`---- ${path.basename(filePath)} ---- `)
    await compileAndRun(filePath, content)
    console.info(`\x1b[A\r---- ${path.basename(filePath)} ---- ✅`)
  } catch (error) {
    console.log(`---- ${filePath} ----\n`, content)
    console.error(
      `Error reading file ${filePath}: ${error}\n\n---- content ----\n${content}\n`,
    )
  }
}
