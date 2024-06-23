export enum TokenType {
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  LeftBrace = 'LeftBrace',
  RightBrace = 'RightBrace',
  Comma = 'Comma',
  Dot = 'Dot',
  Minus = 'Minus',
  Plus = 'Plus',
  Semicolon = 'Semicolon',
  Slash = 'Slash',
  Star = 'Star',
  Percent = 'Percent',

  // One or two character tokens.
  Bang = 'Bang',
  BangEqual = 'BangEqual',
  Equal = 'Equal',
  EqualEqual = 'EqualEqual',
  GreaterThan = 'GreaterThan',
  GreaterOrEqual = 'GreaterOrEqual',
  LessThan = 'LessThan',
  LessOrEqual = 'LessOrEqual',

  // Literals.
  Identifier = 'Identifier',
  String = 'String',
  Number = 'Number',

  // Keywords
  Let = 'Let',
  And = 'And',
  Or = 'Or',
  If = 'If',
  Else = 'Else',
  Func = 'Func',
  For = 'For',
  While = 'While',
  Null = 'Null',
  False = 'False',
  True = 'True',
  Return = 'Return',

  EOF = 'EOF',
  Arrow = 'Arrow',
}

const keywords = new Map<string, TokenType>()
keywords.set('let', TokenType.Let)
keywords.set('and', TokenType.And)
keywords.set('or', TokenType.Or)
keywords.set('if', TokenType.If)
keywords.set('else', TokenType.Else)
keywords.set('func', TokenType.Func)
keywords.set('for', TokenType.For)
keywords.set('while', TokenType.While)
keywords.set('true', TokenType.True)
keywords.set('false', TokenType.False)
keywords.set('null', TokenType.Null)
keywords.set('return', TokenType.Return)

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly lexeme: string,
    public readonly literal: string | number | null,
    public readonly line: number,
  ) {}

  toString() {
    return `${this.type.padEnd(12)} ${this.lexeme} ${
      this.literal ? this.literal : ''
    }`.trim()
  }

  static keywords = keywords
}
