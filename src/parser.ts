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
  Unary,
  Variable,
} from './expr'
import { Block, Expression, Func, If, Let, Return, Stmt, While } from './stmt'
import { Token, TokenKind, Type } from './token'

const parse = (tokens: Token[]) => {
  let current = 0
  const statements = []

  const isAtEnd = () => peek().kind == TokenKind.EOF
  const check = (type: TokenKind) => {
    if (isAtEnd()) return false
    return peek().kind == type
  }

  const advance = () => {
    if (!isAtEnd()) current++
    return previous()
  }
  const peek = () => tokens[current]
  const previous = () => tokens[current - 1]

  const match = (...types: TokenKind[]) => {
    for (let type of types) {
      if (check(type)) {
        advance()
        return true
      }
    }

    return false
  }

  const consume = (type: TokenKind, message: string): Token => {
    if (check(type)) return advance()
    console.error(type, message)
    throw new ParseError()
  }

  const synchronize = () => {
    advance()

    while (!isAtEnd()) {
      if (previous().kind == TokenKind.Semicolon) return

      switch (peek().kind) {
        case TokenKind.Func:
        case TokenKind.Let:
        case TokenKind.If:
        case TokenKind.While:
        case TokenKind.For:
        case TokenKind.Return:
          return
      }

      advance()
    }
  }

  const block = (): Stmt[] => {
    const statements = []
    while (!check(TokenKind.RightBrace) && !isAtEnd()) {
      statements.push(declaration())
    }

    consume(TokenKind.RightBrace, "Expect '}' after block.")
    return statements
  }

  const func = (kind: string) => {
    const name = consume(TokenKind.Identifier, `Expect ${kind} name.`)
    consume(TokenKind.LeftParen, `Expect '(' after ${kind} name.`)

    const params = []
    if (!check(TokenKind.RightParen)) {
      do {
        if (params.length >= 255) {
          console.error(peek(), 'Cannot have more than 255 parameters.')
          throw new ParseError()
        }
        params.push(consume(TokenKind.Identifier, 'Expect parameter name.'))
      } while (match(TokenKind.Comma))
    }

    consume(TokenKind.RightParen, "Expect ')' after parameters.")
    consume(TokenKind.Arrow, `Expect '->' before ${kind} body.`)
    // type expression

    consume(TokenKind.Type, `Expect return type after '->'.`)
    let returnType = previous()

    consume(TokenKind.LeftBrace, `Expect '{' before ${kind} body.`)
    const body = block()

    return new Func(name, params, body, returnType)
  }

  const or = () => {
    let expr = and()

    while (match(TokenKind.Or)) {
      const operator = previous()
      const right = and()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  const term = () => {
    let expr = factor()

    while (match(TokenKind.Minus, TokenKind.Plus)) {
      const operator = previous()
      const right = factor()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  const factor = () => {
    let expr = unary()

    while (match(TokenKind.Slash, TokenKind.Star, TokenKind.Percent)) {
      const operator = previous()
      const right = unary()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  const primary = () => {
    if (match(TokenKind.False)) return new Literal(false, 'boolean')
    if (match(TokenKind.True)) return new Literal(true, 'boolean')
    if (match(TokenKind.Null)) return new Literal(null, 'null')
    if (match(TokenKind.LeftBracket)) {
      const expr = expression()
      consume(TokenKind.RightBracket, "Expect ']' after expression.")
      return new ArrayLiteral([], Type.IntType, expr)
    }

    if (match(TokenKind.Number)) {
      return new Literal(previous().literal, 'number')
    } else if (match(TokenKind.String)) {
      return new Literal(previous().literal, 'string')
    }

    if (match(TokenKind.Identifier)) {
      const variable = previous()
      if (match(TokenKind.LeftBracket)) {
        const expr = expression()
        consume(TokenKind.RightBracket, "Expect ']' after expression.")
        return new ArrayAccess(variable, expr)
      }
      return new Variable(variable)
    }

    if (match(TokenKind.LeftParen)) {
      const expr = expression()
      consume(
        TokenKind.RightParen,
        `Expect ')' after expression. at: ${previous().line}`,
      )
      return new Grouping(expr)
    }
    assert(false, 'Unreachable')
    throw new Error('Unreachable')
  }

  const finishCall = (callee: Expr) => {
    const args = []

    if (!check(TokenKind.RightParen)) {
      do {
        if (args.length >= 255) {
          console.error(peek(), 'Cannot have more than 255 arguments.')
          throw new ParseError()
        }
        args.push(expression())
      } while (match(TokenKind.Comma))
    }

    const paren = consume(TokenKind.RightParen, "Expect ')' after arguments.")

    return new Call(callee, paren, args)
  }

  const call = () => {
    let expr:
      | ArrayLiteral
      | ArrayAccess
      | Literal
      | Variable
      | Grouping
      | Call = primary()

    while (true) {
      if (match(TokenKind.LeftParen)) {
        expr = finishCall(expr)
      } else {
        break
      }
    }

    return expr
  }

  const unary = (): Expr => {
    if (match(TokenKind.Bang, TokenKind.Minus)) {
      const operator = previous()
      const right = unary()
      return new Unary(operator, right)
    }

    return call()
  }

  const comparison = () => {
    let expr = term()

    while (
      match(
        TokenKind.GreaterThan,
        TokenKind.GreaterOrEqual,
        TokenKind.LessThan,
        TokenKind.LessOrEqual,
      )
    ) {
      const operator = previous()
      const right = term()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  const equality = () => {
    let expr = comparison()

    while (match(TokenKind.EqualEqual, TokenKind.BangEqual)) {
      const operator = previous()
      const right = comparison()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  const and = () => {
    let expr = equality()

    while (match(TokenKind.And)) {
      const operator = previous()
      const right = equality()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  const assign = (expr: Expr, value: Expr) => {
    if (expr instanceof Variable) {
      const name = expr.name
      return new Assign(name, value)
    } else if (expr instanceof ArrayAccess) {
      return new Assign(expr, value)
    }

    const equals = previous()
    console.error(equals, 'Invalid assignment target.')
    throw new ParseError()
  }

  const assignment = (): Expr => {
    let expr = or()

    if (
      match(TokenKind.PlusEqual) ||
      match(TokenKind.MinusEqual) ||
      match(TokenKind.StarEqual) ||
      match(TokenKind.SlashEqual)
    ) {
      const operator = baseOp(previous())
      const rhs = assignment()
      const value = new Binary(expr, operator, rhs)
      return assign(expr, value)
    }

    if (match(TokenKind.PlusPlus) || match(TokenKind.MinusMinus)) {
      const op = baseOp(previous())
      const rhs = new Binary(expr, op, new Literal('1', 'number'))
      return assign(expr, rhs)
    }

    if (match(TokenKind.Equal)) {
      const value = assignment()
      return assign(expr, value)
    }

    return expr
  }

  const expression = () => assignment()

  const letDeclaration = () => {
    const name = consume(TokenKind.Identifier, 'Expect variable name.')
    consume(TokenKind.Colon, 'Expect ":" after variable name.')
    const type = consume(TokenKind.Type, 'Expect type after ":".')

    let initializer: Expr = null!
    if (match(TokenKind.Equal)) {
      initializer = expression()
    }

    consume(TokenKind.Semicolon, "Expect ';' after variable declaration.")
    return new Let(name, initializer, type)
  }

  const statement = (): Stmt => {
    if (match(TokenKind.For)) return forStatement()
    if (match(TokenKind.If)) return ifStatement()
    if (match(TokenKind.Return)) return returnStatement()
    if (match(TokenKind.While)) return whileStatement()
    if (match(TokenKind.LeftBrace)) return new Block(block())

    return expressionStatement()
  }

  const forStatement = () => {
    consume(TokenKind.LeftParen, "Expect '(' after 'for'.")

    let initializer: Stmt | null
    if (match(TokenKind.Semicolon)) {
      initializer = null
    } else if (match(TokenKind.Let)) {
      initializer = letDeclaration()
    } else {
      initializer = expressionStatement()
    }

    let condition: Expr | null = null
    if (!check(TokenKind.Semicolon)) {
      condition = expression()
    }
    consume(TokenKind.Semicolon, "Expect ';' after loop condition.")

    let increment: Expr | null = null
    if (!check(TokenKind.RightParen)) {
      increment = expression()
    }
    consume(TokenKind.RightParen, "Expect ')' after for clauses.")

    let body = statement()

    if (increment) {
      body = new Block([body, new Expression(increment)])
    }

    if (!condition) condition = new Literal(true, 'boolean')
    body = new While(condition, body)

    if (initializer) {
      body = new Block([initializer, body])
    }

    return body
  }

  const ifStatement = () => {
    consume(TokenKind.LeftParen, "Expect '(' after 'if'.")
    const condition = expression()
    consume(TokenKind.RightParen, "Expect ')' after if condition.")

    const thenBranch = statement()
    let elseBranch: Stmt | null = null
    if (match(TokenKind.Else)) {
      elseBranch = statement()
    }

    return new If(condition, thenBranch, elseBranch)
  }

  const returnStatement = () => {
    const keyword = previous()
    let value = null
    if (!check(TokenKind.Semicolon)) {
      value = expression()
    }

    consume(TokenKind.Semicolon, "Expect ';' after return value.")
    return new Return(keyword, value)
  }

  const whileStatement = () => {
    consume(TokenKind.LeftParen, "Expect '(' after 'while'.")
    const condition = expression()
    consume(TokenKind.RightParen, "Expect ')' after condition.")
    const body = statement()

    return new While(condition, body)
  }

  const expressionStatement = () => {
    const expr = expression()
    consume(TokenKind.Semicolon, "Expect ';' after expression.")
    return new Expression(expr)
  }

  const declaration = (): Stmt => {
    try {
      if (match(TokenKind.Func)) return func('function')
      if (match(TokenKind.Let)) return letDeclaration()
      return statement()
    } catch (error) {
      synchronize()
      // @ts-expect-error
      return
    }
  }

  while (!isAtEnd()) {
    statements.push(declaration())
  }

  return statements
}

export { parse }

class ParseError extends Error {}

const baseOp = (token: Token) => {
  switch (token.kind) {
    case TokenKind.PlusPlus:
    case TokenKind.PlusEqual:
      return new Token(TokenKind.Plus, '+', null, 0)
    case TokenKind.MinusMinus:
    case TokenKind.MinusEqual:
      return new Token(TokenKind.Minus, '-', null, 0)
    case TokenKind.StarEqual:
      return new Token(TokenKind.Star, '*', null, 0)
    case TokenKind.SlashEqual:
      return new Token(TokenKind.Slash, '/', null, 0)
  }
  console.error(token, 'Token has no base operation.')
  throw new ParseError()
}
