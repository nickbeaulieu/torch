import { Token, TokenKind, Type } from './token'

// based on https://craftinginterpreters.com/scanning.html
function tokenize(input: string) {
  let source = input
  let start = 0
  let current = 0
  let line = 1
  let tokens: Token[] = []

  const isAtEnd = () => current >= source.length
  const advance = () => source.charAt(current++)
  const isDigit = (c: string) => (c >= '0' && c <= '9') || c == '_'
  const isAlpha = (c: string) =>
    (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'
  const isAlphaNumeric = (c: string) => isAlpha(c) || isDigit(c)

  const match = (expected: string) => {
    if (isAtEnd()) return false
    if (source.charAt(current) != expected) return false

    current++
    return true
  }

  const peek = () => {
    if (isAtEnd()) return '\0'
    return source.charAt(current)
  }

  const peekNext = () => {
    if (current + 1 >= source.length) return '\0'
    return source.charAt(current + 1)
  }

  const addToken = (type: TokenKind) => addTokenLiteral(type, null)
  const addTokenLiteral = (
    type: TokenKind,
    literal: string | number | null,
  ) => {
    const text = source.substring(start, current)
    tokens.push(new Token(type, text, literal, line))
  }

  const string = () => {
    while (peek() != '"' && !isAtEnd()) {
      if (peek() == '\n') line++
      advance()
    }

    if (isAtEnd()) {
      console.error(line, 'Unterminated string.')
      return
    }

    // The closing ".
    advance()

    // Trim the surrounding quotes.
    const value = source.substring(start + 1, current - 1)
    addTokenLiteral(TokenKind.String, value)
  }

  const number = () => {
    while (isDigit(peek())) advance()

    let fractional = false
    // Look for a fractional part.
    if (peek() == '.' && isDigit(peekNext())) {
      // Consume the "."
      advance()
      fractional = true

      while (isDigit(peek())) advance()
    }

    const text = source.substring(start, current).replaceAll(/_/g, '')

    addTokenLiteral(TokenKind.Number, text)
  }

  const type = (type: Type) => {
    if (peek() == '[' && peekNext() == ']') {
      advance()
      advance()
      const text = source.substring(start, current)
      tokens.push(
        new Token(TokenKind.Type, text, null, line, Type.ArrayType, type),
      )
      return
    }
    const text = source.substring(start, current)
    tokens.push(new Token(TokenKind.Type, text, null, line, type))
    return
  }

  const identifier = () => {
    while (isAlphaNumeric(peek())) advance()

    const text = source.substring(start, current)
    let tokenType = Token.types.get(text)
    if (tokenType != null) {
      return type(tokenType)
    }

    let keyword = Token.keywords.get(text)
    if (keyword != null) {
      addToken(keyword)
      return
    }

    addToken(TokenKind.Identifier)
  }

  const scanToken = () => {
    const c = advance()
    // prettier-ignore
    switch(c) {
      case '(': addToken(TokenKind.LeftParen); break;
      case ')': addToken(TokenKind.RightParen); break;
      case '[': addToken(TokenKind.LeftBracket); break;
      case ']': addToken(TokenKind.RightBracket); break;
      case '{': addToken(TokenKind.LeftBrace); break;
      case '}': addToken(TokenKind.RightBrace); break;
      case ',': addToken(TokenKind.Comma); break;
      case '.': addToken(TokenKind.Dot); break;
      case '+': addToken(match('+') ? TokenKind.PlusPlus : TokenKind.Plus); break;
      case ';': addToken(TokenKind.Semicolon); break;
      case ':': addToken(TokenKind.Colon); break;
      case '*': addToken(TokenKind.Star); break; 
      case '%': addToken(TokenKind.Percent); break; 
      case '-': addToken(match('>') ? 
        TokenKind.Arrow : 
        match('-') ? 
          TokenKind.MinusMinus : 
          TokenKind.Minus
      ); break;
      // prettier-ignore
      case '!': addToken(match('=') ? TokenKind.BangEqual : TokenKind.Bang); break;
      case '=': addToken(match('=') ? TokenKind.EqualEqual : TokenKind.Equal);break;
      case '<': addToken(match('=') ? TokenKind.LessOrEqual : TokenKind.LessThan);break;
      case '>': addToken(match('=') ? TokenKind.GreaterOrEqual : TokenKind.GreaterThan);break;

      case '/':
        if (match('/')) {
          // A comment goes until the end of the line.
          while (peek() != '\n' && !isAtEnd()) advance();
        } else {
          addToken(TokenKind.Slash);
        }
        break;

      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break;

      case '\n':
        line++;
        break;

      case '"': string(); break;
      default:
        if (isDigit(c)) 
          number();
         else if (isAlpha(c)) 
          identifier();
         else 
          console.error("Unexpected character on line " + line + " at " + current, source.charAt(current));
        break;
    }
  }

  while (!isAtEnd()) {
    start = current
    scanToken()
  }
  tokens.push(new Token(TokenKind.EOF, '', null, line))

  return tokens
}

export { tokenize }
