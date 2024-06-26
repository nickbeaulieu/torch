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

export class Parser {
  private tokens: Token[]
  private current: number = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  expression() {
    return this.assignment()
  }

  parse() {
    const statements = []
    while (!this.isAtEnd()) {
      statements.push(this.declaration())
    }

    return statements
  }

  private assignment(): Expr {
    let expr = this.or()

    if (this.match(TokenKind.Equal)) {
      const equals = this.previous()
      const value = this.assignment()

      if (expr instanceof Variable) {
        const name = expr.name
        return new Assign(name, value)
      } else if (expr instanceof ArrayAccess) {
        return new Assign(expr, value)
      }

      console.error(equals, 'Invalid assignment target.')
      throw new ParseError()
    }

    return expr
  }

  private or() {
    let expr = this.and()

    while (this.match(TokenKind.Or)) {
      const operator = this.previous()
      const right = this.and()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  private and() {
    let expr = this.equality()

    while (this.match(TokenKind.And)) {
      const operator = this.previous()
      const right = this.equality()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenKind.Func)) return this.function('function')
      if (this.match(TokenKind.Let)) return this.letDeclaration()
      return this.statement()
    } catch (error) {
      this.synchronize()
      // @ts-expect-error
      return null
    }
  }

  private letDeclaration() {
    const name = this.consume(TokenKind.Identifier, 'Expect variable name.')
    this.consume(TokenKind.Colon, 'Expect ":" after variable name.')
    const type = this.consume(TokenKind.Type, 'Expect type after ":".')

    let initializer: Expr = null!
    if (this.match(TokenKind.Equal)) {
      initializer = this.expression()
    }

    this.consume(TokenKind.Semicolon, "Expect ';' after variable declaration.")
    return new Let(name, initializer, type)
  }

  private statement(): Stmt {
    if (this.match(TokenKind.For)) return this.forStatement()
    if (this.match(TokenKind.If)) return this.ifStatement()
    if (this.match(TokenKind.Return)) return this.returnStatement()
    if (this.match(TokenKind.While)) return this.whileStatement()
    if (this.match(TokenKind.LeftBrace)) return new Block(this.block())

    return this.expressionStatement()
  }

  private forStatement() {
    this.consume(TokenKind.LeftParen, "Expect '(' after 'for'.")

    let initializer: Stmt | null
    if (this.match(TokenKind.Semicolon)) {
      initializer = null
    } else if (this.match(TokenKind.Let)) {
      initializer = this.letDeclaration()
    } else {
      initializer = this.expressionStatement()
    }

    let condition: Expr | null = null
    if (!this.check(TokenKind.Semicolon)) {
      condition = this.expression()
    }
    this.consume(TokenKind.Semicolon, "Expect ';' after loop condition.")

    let increment: Expr | null = null
    if (!this.check(TokenKind.RightParen)) {
      increment = this.expression()
    }
    this.consume(TokenKind.RightParen, "Expect ')' after for clauses.")

    let body = this.statement()

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

  private ifStatement() {
    this.consume(TokenKind.LeftParen, "Expect '(' after 'if'.")
    const condition = this.expression()
    this.consume(TokenKind.RightParen, "Expect ')' after if condition.")

    const thenBranch = this.statement()
    let elseBranch: Stmt | null = null
    if (this.match(TokenKind.Else)) {
      elseBranch = this.statement()
    }

    return new If(condition, thenBranch, elseBranch)
  }

  private returnStatement() {
    const keyword = this.previous()
    let value = null
    if (!this.check(TokenKind.Semicolon)) {
      value = this.expression()
    }

    this.consume(TokenKind.Semicolon, "Expect ';' after return value.")
    return new Return(keyword, value)
  }

  private whileStatement() {
    this.consume(TokenKind.LeftParen, "Expect '(' after 'while'.")
    const condition = this.expression()
    this.consume(TokenKind.RightParen, "Expect ')' after condition.")
    const body = this.statement()

    return new While(condition, body)
  }

  private expressionStatement() {
    const expr = this.expression()
    this.consume(TokenKind.Semicolon, "Expect ';' after expression.")
    return new Expression(expr)
  }

  private function(kind: string) {
    const name = this.consume(TokenKind.Identifier, `Expect ${kind} name.`)
    this.consume(TokenKind.LeftParen, `Expect '(' after ${kind} name.`)

    const params = []
    if (!this.check(TokenKind.RightParen)) {
      do {
        if (params.length >= 255) {
          console.error(this.peek(), 'Cannot have more than 255 parameters.')
          throw new ParseError()
        }
        params.push(
          this.consume(TokenKind.Identifier, 'Expect parameter name.'),
        )
      } while (this.match(TokenKind.Comma))
    }

    this.consume(TokenKind.RightParen, "Expect ')' after parameters.")
    this.consume(TokenKind.Arrow, `Expect '->' before ${kind} body.`)
    // type expression

    this.consume(TokenKind.Type, `Expect return type after '->'.`)
    let returnType = this.previous()

    this.consume(TokenKind.LeftBrace, `Expect '{' before ${kind} body.`)
    const body = this.block()

    return new Func(name, params, body, returnType)
  }

  private block(): Stmt[] {
    const statements = []
    while (!this.check(TokenKind.RightBrace) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }

    this.consume(TokenKind.RightBrace, "Expect '}' after block.")
    return statements
  }

  private equality() {
    let expr = this.comparison()

    while (this.match(TokenKind.EqualEqual, TokenKind.BangEqual)) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private match(...types: TokenKind[]) {
    for (let type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }

    return false
  }

  private check(type: TokenKind) {
    if (this.isAtEnd()) return false
    return this.peek().kind == type
  }

  private advance() {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  private isAtEnd() {
    return this.peek().kind == TokenKind.EOF
  }

  private peek() {
    return this.tokens[this.current]
  }

  private previous() {
    return this.tokens[this.current - 1]
  }

  private comparison() {
    let expr = this.term()

    while (
      this.match(
        TokenKind.GreaterThan,
        TokenKind.GreaterOrEqual,
        TokenKind.LessThan,
        TokenKind.LessOrEqual,
      )
    ) {
      const operator = this.previous()
      const right = this.term()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private term() {
    let expr = this.factor()

    while (this.match(TokenKind.Minus, TokenKind.Plus)) {
      const operator = this.previous()
      const right = this.factor()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private factor() {
    let expr = this.unary()

    while (this.match(TokenKind.Slash, TokenKind.Star, TokenKind.Percent)) {
      const operator = this.previous()
      const right = this.unary()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private unary(): Expr {
    if (this.match(TokenKind.Bang, TokenKind.Minus)) {
      const operator = this.previous()
      const right = this.unary()
      return new Unary(operator, right)
    }

    return this.call()
  }

  private finishCall(callee: Expr) {
    const args = []

    if (!this.check(TokenKind.RightParen)) {
      do {
        if (args.length >= 255) {
          console.error(this.peek(), 'Cannot have more than 255 arguments.')
          throw new ParseError()
        }
        args.push(this.expression())
      } while (this.match(TokenKind.Comma))
    }

    const paren = this.consume(
      TokenKind.RightParen,
      "Expect ')' after arguments.",
    )

    return new Call(callee, paren, args)
  }

  private call() {
    let expr:
      | ArrayLiteral
      | ArrayAccess
      | Literal
      | Variable
      | Grouping
      | Call = this.primary()

    while (true) {
      if (this.match(TokenKind.LeftParen)) {
        expr = this.finishCall(expr)
      } else {
        break
      }
    }

    return expr
  }

  private primary() {
    if (this.match(TokenKind.False)) return new Literal(false, 'boolean')
    if (this.match(TokenKind.True)) return new Literal(true, 'boolean')
    if (this.match(TokenKind.Null)) return new Literal(null, 'null')
    if (this.match(TokenKind.LeftBracket)) {
      const expr = this.expression()
      this.consume(TokenKind.RightBracket, "Expect ']' after expression.")
      return new ArrayLiteral([], Type.IntType, expr)
    }

    if (this.match(TokenKind.Number)) {
      return new Literal(this.previous().literal, 'number')
    } else if (this.match(TokenKind.String)) {
      return new Literal(this.previous().literal, 'string')
    }

    if (this.match(TokenKind.Identifier)) {
      // FIXME: not an int...
      const variable = this.previous()
      if (this.match(TokenKind.LeftBracket)) {
        const expr = this.expression()
        this.consume(TokenKind.RightBracket, "Expect ']' after expression.")
        return new ArrayAccess(variable, expr)
      }
      return new Variable(variable, Type.IntType)
    }

    if (this.match(TokenKind.LeftParen)) {
      const expr = this.expression()
      this.consume(
        TokenKind.RightParen,
        `Expect ')' after expression. at: ${this.previous().line}`,
      )
      return new Grouping(expr)
    }
    assert(false, 'Unreachable')
    throw new Error('Unreachable')
  }

  private consume(type: TokenKind, message: string): Token {
    if (this.check(type)) return this.advance()
    console.error(type, message)
    throw new ParseError()
  }

  private synchronize() {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().kind == TokenKind.Semicolon) return

      switch (this.peek().kind) {
        case TokenKind.Func:
        case TokenKind.Let:
        case TokenKind.If:
        case TokenKind.While:
        case TokenKind.For:
        case TokenKind.Return:
          return
      }

      this.advance()
    }
  }
}

class ParseError extends Error {}
