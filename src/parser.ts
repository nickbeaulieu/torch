import { assert } from '../utils'
import {
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
import { Token, TokenType } from './token'

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

    if (this.match(TokenType.Equal)) {
      const equals = this.previous()
      const value = this.assignment()

      if (expr instanceof Variable) {
        const name = expr.name
        return new Assign(name, value)
      }

      console.error(equals, 'Invalid assignment target.')
      throw new ParseError()
    }

    return expr
  }

  private or() {
    let expr = this.and()

    while (this.match(TokenType.Or)) {
      const operator = this.previous()
      const right = this.and()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  private and() {
    let expr = this.equality()

    while (this.match(TokenType.And)) {
      const operator = this.previous()
      const right = this.equality()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.Func)) return this.function('function')
      if (this.match(TokenType.Let)) return this.letDeclaration()
      return this.statement()
    } catch (error) {
      this.synchronize()
      // @ts-expect-error
      return null
    }
  }

  private letDeclaration() {
    const name = this.consume(TokenType.Identifier, 'Expect variable name.')

    let initializer: Expr = null!
    if (this.match(TokenType.Equal)) {
      initializer = this.expression()
    }

    this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.")
    return new Let(name, initializer)
  }

  private statement(): Stmt {
    if (this.match(TokenType.For)) return this.forStatement()
    if (this.match(TokenType.If)) return this.ifStatement()
    if (this.match(TokenType.Return)) return this.returnStatement()
    if (this.match(TokenType.While)) return this.whileStatement()
    if (this.match(TokenType.LeftBrace)) return new Block(this.block())

    return this.expressionStatement()
  }

  private forStatement() {
    this.consume(TokenType.LeftParen, "Expect '(' after 'for'.")

    let initializer: Stmt | null
    if (this.match(TokenType.Semicolon)) {
      initializer = null
    } else if (this.match(TokenType.Let)) {
      initializer = this.letDeclaration()
    } else {
      initializer = this.expressionStatement()
    }

    let condition: Expr | null = null
    if (!this.check(TokenType.Semicolon)) {
      condition = this.expression()
    }
    this.consume(TokenType.Semicolon, "Expect ';' after loop condition.")

    let increment: Expr | null = null
    if (!this.check(TokenType.RightParen)) {
      increment = this.expression()
    }
    this.consume(TokenType.RightParen, "Expect ')' after for clauses.")

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
    this.consume(TokenType.LeftParen, "Expect '(' after 'if'.")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after if condition.")

    const thenBranch = this.statement()
    let elseBranch: Stmt | null = null
    if (this.match(TokenType.Else)) {
      elseBranch = this.statement()
    }

    return new If(condition, thenBranch, elseBranch)
  }

  private returnStatement() {
    const keyword = this.previous()
    let value = null
    if (!this.check(TokenType.Semicolon)) {
      value = this.expression()
    }

    this.consume(TokenType.Semicolon, "Expect ';' after return value.")
    return new Return(keyword, value)
  }

  private whileStatement() {
    this.consume(TokenType.LeftParen, "Expect '(' after 'while'.")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after condition.")
    const body = this.statement()

    return new While(condition, body)
  }

  private expressionStatement() {
    const expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after expression.")
    return new Expression(expr)
  }

  private function(kind: string) {
    const name = this.consume(TokenType.Identifier, `Expect ${kind} name.`)
    this.consume(TokenType.LeftParen, `Expect '(' after ${kind} name.`)

    const params = []
    if (!this.check(TokenType.RightParen)) {
      do {
        if (params.length >= 255) {
          console.error(this.peek(), 'Cannot have more than 255 parameters.')
          throw new ParseError()
        }
        params.push(
          this.consume(TokenType.Identifier, 'Expect parameter name.'),
        )
      } while (this.match(TokenType.Comma))
    }

    this.consume(TokenType.RightParen, "Expect ')' after parameters.")
    this.consume(TokenType.Arrow, `Expect '->' before ${kind} body.`)
    // type expression
    this.consume(
      TokenType.Identifier,
      `Expect 'type identifier' before ${kind} body.`,
    )
    let returnType = this.previous()
    this.consume(TokenType.LeftBrace, `Expect '{' before ${kind} body.`)
    const body = this.block()
    if (!(body.at(-1) instanceof Return)) {
      if (name.lexeme === 'main' && returnType.lexeme !== 'int') {
        console.error('Expect main function to return int')
        throw new ParseError()
      }

      if (returnType.lexeme !== 'void') {
        console.error(
          returnType,
          'Expect return statement at the end of the function.',
        )
        throw new ParseError()
      }
    } else {
      // end of body is return statement
      const returnStmt = body.at(-1) as Return
      if (returnStmt.value instanceof Literal) {
        if (returnType.lexeme === 'int') {
          if (returnStmt.value.type !== 'number') {
            console.error(returnStmt.value, 'Expect return type to be an int')
            throw new ParseError()
          }
        }
      }
    }

    return new Func(name, params, body, returnType)
  }

  private block(): Stmt[] {
    const statements = []
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }

    this.consume(TokenType.RightBrace, "Expect '}' after block.")
    return statements
  }

  private equality() {
    let expr = this.comparison()

    while (this.match(TokenType.EqualEqual, TokenType.BangEqual)) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private match(...types: TokenType[]) {
    for (let type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }

    return false
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) return false
    return this.peek().type == type
  }

  private advance() {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  private isAtEnd() {
    return this.peek().type == TokenType.EOF
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
        TokenType.GreaterThan,
        TokenType.GreaterOrEqual,
        TokenType.LessThan,
        TokenType.LessOrEqual,
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

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator = this.previous()
      const right = this.factor()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private factor() {
    let expr = this.unary()

    while (this.match(TokenType.Slash, TokenType.Star, TokenType.Percent)) {
      const operator = this.previous()
      const right = this.unary()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  private unary(): Expr {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous()
      const right = this.unary()
      return new Unary(operator, right)
    }

    return this.call()
  }

  private finishCall(callee: Expr) {
    const args = []

    if (!this.check(TokenType.RightParen)) {
      do {
        if (args.length >= 255) {
          console.error(this.peek(), 'Cannot have more than 255 arguments.')
          throw new ParseError()
        }
        args.push(this.expression())
      } while (this.match(TokenType.Comma))
    }

    const paren = this.consume(
      TokenType.RightParen,
      "Expect ')' after arguments.",
    )

    return new Call(callee, paren, args)
  }

  private call() {
    let expr: Literal | Variable | Grouping | Call = this.primary()

    while (true) {
      if (this.match(TokenType.LeftParen)) {
        expr = this.finishCall(expr)
      } else {
        break
      }
    }

    return expr
  }

  private primary() {
    if (this.match(TokenType.False)) return new Literal(false, 'boolean')
    if (this.match(TokenType.True)) return new Literal(true, 'boolean')
    if (this.match(TokenType.Null)) return new Literal(null, 'null')

    if (this.match(TokenType.Number)) {
      return new Literal(this.previous().literal, 'number')
    } else if (this.match(TokenType.String)) {
      return new Literal(this.previous().literal, 'string')
    }

    if (this.match(TokenType.Identifier)) {
      return new Variable(this.previous())
    }

    if (this.match(TokenType.LeftParen)) {
      const expr = this.expression()
      this.consume(TokenType.RightParen, "Expect ')' after expression.")
      return new Grouping(expr)
    }
    assert(false, 'Unreachable')
    throw new Error('Unreachable')
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()
    console.error(type, message)
    throw new ParseError()
  }

  private synchronize() {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.Semicolon) return

      switch (this.peek().type) {
        case TokenType.Func:
        case TokenType.Let:
        case TokenType.If:
        case TokenType.While:
        case TokenType.For:
        case TokenType.Return:
          return
      }

      this.advance()
    }
  }
}

class ParseError extends Error {}
