import { assert } from '../utils'
import {
  ArrayAccess,
  ArrayLiteral,
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
import { Token, Type } from './token'

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
      assert(stmt.type !== null, 'Return type is required')
      output += `${stmt.type?.lexeme} ${stmt.name.lexeme}() {\n`
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
      const [type, subtype] = getTypes(stmt.type)
      if (type === Type.ArrayType) {
        assert(subtype !== null, 'Array type requires subtype')
        assert(stmt.initializer instanceof ArrayLiteral, 'Expect array literal')
        output += `${generateTypes(subtype!)} ${stmt.name.lexeme}[${generateExpression((stmt.initializer as ArrayLiteral).size)}] = {};\n`
        return output
      }
      output += `${generateTypes(type)} ${stmt.name.lexeme} = ${generateExpression(stmt.initializer)};\n`
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

    case stmt instanceof ArrayLiteral:
      console.log('static array', stmt)
      assert(false, 'Unreachable: array literal')
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
    case expr instanceof ArrayAccess:
      return `${expr.name.lexeme}[${generateExpression(expr.index)}]`
    case expr instanceof Assign:
      if (expr.name instanceof ArrayAccess) {
        return `${generateExpression(expr.name)} = ${generateExpression(expr.value)}`
      }
      return `${expr.name.lexeme} = ${generateExpression(expr.value)}`
    case expr instanceof Literal:
      if (expr.type === 'number' || expr.type === 'boolean') {
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

function getTypes(token: Token) {
  if (!token.type) {
    console.error('No type', token)
    assert(false, 'Unreachable: unknown type')
  }
  return [token.type!, token.subtype] as const
}

function generateTypes(type: Type) {
  switch (type) {
    case Type.StringType:
      return 'char*'
    case Type.IntType:
      return 'int'
    case Type.BoolType:
      return 'bool'
    default:
      assert(false, 'Unreachable: unknown type')
      return ''
  }
}
