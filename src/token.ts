export enum TokenKind {
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  LeftBrace = 'LeftBrace',
  RightBrace = 'RightBrace',
  LeftBracket = 'LeftBracket',
  RightBracket = 'RightBracket',
  Comma = 'Comma',
  Dot = 'Dot',
  Minus = 'Minus',
  MinusMinus = 'MinusMinus',
  Plus = 'Plus',
  PlusPlus = 'PlusPlus',
  Semicolon = 'Semicolon',
  Colon = 'Colon',
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
  Array = 'Array',

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

  Type = 'Type',

  EOF = 'EOF',
  Arrow = 'Arrow',
}

export enum Type {
  // Types
  VoidType = 'VoidType',

  BoolType = 'BoolType',

  U8Type = 'U8Type',
  U16Type = 'U16Type',
  U32Type = 'U32Type',
  U64Type = 'U64Type',
  UIntType = 'UIntType',

  I8Type = 'I8Type',
  I16Type = 'I16Type',
  I32Type = 'I32Type',
  I64Type = 'I64Type',
  IntType = 'IntType',

  F32Type = 'F32Type',
  F64Type = 'F64Type',
  FloatType = 'FloatType',

  CharType = 'CharType',
  StringType = 'StringType',

  ArrayType = 'ArrayType',
}

const keywords = new Map<string, TokenKind>()
keywords.set('let', TokenKind.Let)
keywords.set('and', TokenKind.And)
keywords.set('or', TokenKind.Or)
keywords.set('if', TokenKind.If)
keywords.set('else', TokenKind.Else)
keywords.set('func', TokenKind.Func)
keywords.set('for', TokenKind.For)
keywords.set('while', TokenKind.While)
keywords.set('true', TokenKind.True)
keywords.set('false', TokenKind.False)
keywords.set('null', TokenKind.Null)
keywords.set('return', TokenKind.Return)

const types = new Map<string, Type>()
types.set('void', Type.VoidType) // void
types.set('bool', Type.BoolType) // bool

types.set('u8', Type.U8Type) // u_int8_t or unsigned char
types.set('u16', Type.U16Type) // u_int16_t or unsigned short
types.set('u32', Type.U32Type) // u_int32_t or unsigned int
types.set('u64', Type.U64Type) // u_int64_t or unsigned long
types.set('uint', Type.UIntType) // (u32) u_int32_t or unsigned int

types.set('i8', Type.I8Type) // int8_t or char
types.set('i16', Type.I16Type) // int16_t or short
types.set('i32', Type.I32Type) // int32_t or int
types.set('i64', Type.I64Type) // int64_t or long
types.set('int', Type.IntType) // (i32) int32_t or int

types.set('f32', Type.F32Type) // float
types.set('f64', Type.F64Type) // double
types.set('float', Type.FloatType) // (f32) float
types.set('char', Type.CharType) // char
types.set('str', Type.StringType) // char*

export class Token {
  constructor(
    public readonly kind: TokenKind,
    public readonly lexeme: string,
    public readonly literal: string | number | null,
    public readonly line: number,
    public readonly type: Type | null = null,
    // If type is array, this will be the type contained in the array
    public readonly subtype: Type | null = null,
  ) {}

  toString() {
    return `${this.kind.padEnd(12)} ${this.lexeme} ${
      this.literal ? this.literal : ''
    }`.trim()
  }

  static keywords = keywords
  static types = types
}
