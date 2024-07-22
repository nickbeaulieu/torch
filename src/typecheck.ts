import { ThrowStatement } from 'typescript'
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
import { Type } from './token'

export function typecheck(statements: Stmt[]) {
  // init a program state, to keep track of variables and function names, etc.
  statements.map(typecheckStatement)
}

function typecheckStatement(stmt: Stmt) {
  switch (true) {
    case stmt instanceof Func:
      const { name, type, body } = stmt
      if (name.lexeme === 'main' && type.type!.type !== Type.IntType) {
        error('Expect function `main` to return `int`')
      }
      for (let stmt of body) {
        typecheckStatement(stmt)
      }
      if (body.at(-1) instanceof Return) {
        // end of body is return statement
        const returnStmt = body.at(-1) as Return
        if (returnStmt.value instanceof Literal) {
          if (type.lexeme === 'int') {
            if (returnStmt.value.type !== 'number') {
              error('Expect return type to be an int')
            }
          }
        }
      } else {
        if (type.lexeme !== 'void') {
          error(
            `Expect return statement at the end of the function. Got: ${type.lexeme}`,
          )
        }
      }
    case stmt instanceof Return:
      return
    case stmt instanceof Expression:
      typecheckExpression(stmt.expression)
      return
    case stmt instanceof Let:
      typecheckType(stmt.type.type!.type, stmt.initializer)
      return
    case stmt instanceof Block:
      return
    case stmt instanceof If:
      return
    case stmt instanceof While:
      return
    default:
      console.warn('typecheck: stmt:', stmt)
      // assert(false, 'Unreachable: unknown statement type')
      return ''
  }
}

function typecheckExpression(expr: Expr) {
  switch (true) {
    case expr instanceof Call:
      // check if function exists
      // check if function has the right number of arguments
      // check if function arguments are of the right type
      // check if function return type is the right type
      return
    case expr instanceof Binary:
      // check if left and right are of the right type
      // check if operator is of the right type
      // check if the result of the binary operation is of the right type
      console.log('binary', expr)
      return
    case expr instanceof Logical:
      // check if left and right are of the right type
      // check if operator is of the right type
      // check if the result of the logical operation is of the right type
      return
    case expr instanceof Grouping:
      // evaluate the expressions inside the grouping?
      return
    case expr instanceof Variable:
      // check if variable exists
      return
    case expr instanceof Assign:
      // check if variable exists
      // check if variable is of the right type
      return
    case expr instanceof Literal:
      // check if literal
      return
    default:
      console.warn('typecheck: expr:', expr)
      assert(false, 'Unreachable: unknown expression type')
      return ''
  }
}

function typecheckType(type: Type | null, expr: Expr) {
  if (expr instanceof Literal) {
    if (type === Type.StringType && expr.type !== 'string')
      error(`Expected \`str\`, not ${expr.value}`)
    if (
      type === Type.UIntType &&
      (expr.type !== 'number' || expr.value < 0 || expr.value % 1 !== 0)
    )
      error(`Expected \`uint\`, not ${expr.value}`)

    if (
      type === Type.IntType &&
      (expr.type !== 'number' || expr.value % 1 !== 0)
    )
      error(`Expected \`int\`, not ${expr.value}`)
  }
}

function error(message: string): ThrowStatement {
  console.error(message)
  throw new TypecheckError()
}
class TypecheckError extends Error {}
