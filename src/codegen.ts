import { assert } from '../utils'
import {
  Assign,
  Binary,
  Call,
  Expr,
  Grouping,
  Literal,
  Logical,
  Variable,
} from './expr'
import { Block, Expression, Func, If, Let, Return, Stmt, While } from './stmt'

export function generateC(statements: Stmt[]) {
  let output = `#include <stdio.h>
#include <stdbool.h>
#include <string.h>

#define print(value, ...) printf(value, ##__VA_ARGS__)
#define println(value, ...) { printf(value, ##__VA_ARGS__); printf("\\n"); }
\n\n`
  output += statements.map(generateStatement).join('')

  Bun.write('output.c', output)
}

function generateStatement(stmt: Stmt): string {
  let output = ''
  // some statements should end with a semicolon

  switch (true) {
    case stmt instanceof Func:
      assert(stmt.returnType !== null, 'Return type is required')
      output += `${stmt.returnType?.lexeme} ${stmt.name.lexeme}() {\n`
      output += stmt.body.map(generateStatement).join('\n')
      output += '\n}\n'
      return output
    case stmt instanceof Return:
      return `return ${
        stmt.value !== null ? generateExpression(stmt.value) : ''
      };`
    case stmt instanceof Expression:
      return generateExpression(stmt.expression) + ';'
    case stmt instanceof Let:
      if (stmt.initializer instanceof Binary) {
        // FIXME: assumes int for now
        output += `int ${stmt.name.lexeme} = ${generateExpression(stmt.initializer)};\n`
        return output
      }

      // FIXME: assumes type is int, string, bool, or null
      const expr = stmt.initializer instanceof Literal ? stmt.initializer : null
      if (expr === null) {
        assert(false, 'Only literals are supported for now')
        return ''
      }

      const type =
        expr.type === 'null'
          ? 'void*'
          : expr.type === 'number'
            ? 'int'
            : expr.type === 'string'
              ? 'char*'
              : 'bool'

      output += `${type} ${stmt.name.lexeme} = ${generateExpression(expr)};\n`
      return output
    case stmt instanceof Block:
      output += '{\n'
      output += stmt.statements.map(generateStatement).join('')
      output += '}\n'
      return output

    case stmt instanceof If:
      output += `if (${generateExpression(stmt.condition)}) {\n`
      output += generateStatement(stmt.thenBranch)
      output += '}\n'
      if (stmt.elseBranch !== null) {
        output += 'else {\n'
        output += generateStatement(stmt.elseBranch)
        output += '}\n'
      }
      return output

    case stmt instanceof While:
      output += `while (${generateExpression(stmt.condition)}) {\n`
      output += generateStatement(stmt.body)
      output += '}\n'
      return output

    default:
      console.error('stmt', stmt)
      assert(false, 'Unreachable: unknown statement type')
      return ''
  }
}

function generateExpression(expr: Expr): string {
  let output = ''

  switch (true) {
    case expr instanceof Call:
      if (expr.callee instanceof Variable) {
        output += `${expr.callee.name.lexeme}(${expr.args
          .map(generateExpression)
          .join(', ')})`
        return output
      }
      assert(false, 'Unknown expression type')
      return ''
    case expr instanceof Binary:
      return `${generateExpression(expr.left)} ${
        expr.operator.lexeme
      } ${generateExpression(expr.right)}`
    case expr instanceof Logical:
      const op = expr.operator.lexeme === 'or' ? '||' : '&&'
      return `${generateExpression(expr.left)} ${
        op
      } ${generateExpression(expr.right)}`
    case expr instanceof Grouping:
      return `(${generateExpression(expr.expression)})`
    case expr instanceof Variable:
      return `${expr.name.lexeme}`
    case expr instanceof Assign:
      return `${expr.name.lexeme} = ${generateExpression(expr.value)}`
    case expr instanceof Literal:
      if (expr.type === 'number') {
        return `${expr.value}`
      } else if (expr.type === 'boolean') {
        return `${expr.value}`
      } else if (expr.type === 'null') {
        return `NULL`
      } else if (expr.type === 'string') {
        return `"${expr.value}"`
      }
    default:
      console.error('expr', expr)
      assert(false, 'Unreachable: unknown expression type')
      return ''
  }
}
