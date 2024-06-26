import { Token, TokenKind, Type } from './token'

// heavily based on https://craftinginterpreters.com/scanning.html

export class Lexer {
  private source: string = ''
  private start: number = 0
  private current: number = 0
  private line: number = 1
  tokens: Token[] = []

  tokenize(input: string) {
    this.source = input
    this.scanTokens()
    return this.tokens
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  private scanTokens() {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current
      this.scanToken()
    }
    this.tokens.push(new Token(TokenKind.EOF, '', null, this.line))
  }

  private scanToken() {
    const c = this.advance()
    // prettier-ignore
    switch(c) {
      case '(': this.addToken(TokenKind.LeftParen); break;
      case ')': this.addToken(TokenKind.RightParen); break;
      case '[': this.addToken(TokenKind.LeftBracket); break;
      case ']': this.addToken(TokenKind.RightBracket); break;
      case '{': this.addToken(TokenKind.LeftBrace); break;
      case '}': this.addToken(TokenKind.RightBrace); break;
      case ',': this.addToken(TokenKind.Comma); break;
      case '.': this.addToken(TokenKind.Dot); break;
      case '+': this.addToken(TokenKind.Plus); break;
      case ';': this.addToken(TokenKind.Semicolon); break;
      case ':': this.addToken(TokenKind.Colon); break;
      case '*': this.addToken(TokenKind.Star); break; 
      case '%': this.addToken(TokenKind.Percent); break; 
      
      case '-': this.addToken(this.match('>') ? TokenKind.Arrow : TokenKind.Minus); break;
      // prettier-ignore
      case '!': this.addToken(this.match('=') ? TokenKind.BangEqual : TokenKind.Bang); break;
      case '=': this.addToken(this.match('=') ? TokenKind.EqualEqual : TokenKind.Equal);break;
      case '<': this.addToken(this.match('=') ? TokenKind.LessOrEqual : TokenKind.LessThan);break;
      case '>': this.addToken(this.match('=') ? TokenKind.GreaterOrEqual : TokenKind.GreaterThan);break;

      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line.
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenKind.Slash);
        }
        break;

      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break;

      case '\n':
        this.line++;
        break;

      case '"': this.string(); break;
      default:
        if (this.isDigit(c)) 
          this.number();
         else if (this.isAlpha(c)) 
          this.identifier();
         else 
          console.error("Unexpected character on line " + this.line + " at " + this.current, this.source.charAt(this.current));
        break;
    }
  }

  private match(expected: string) {
    if (this.isAtEnd()) return false
    if (this.source.charAt(this.current) != expected) return false

    this.current++
    return true
  }

  private peek() {
    if (this.isAtEnd()) return '\0'
    return this.source.charAt(this.current)
  }

  private peekNext() {
    if (this.current + 1 >= this.source.length) return '\0'
    return this.source.charAt(this.current + 1)
  }

  private advance() {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenKind) {
    this.addTokenLiteral(type, null)
  }

  private addTokenLiteral(type: TokenKind, literal: string | number | null) {
    const text = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }

  private string() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == '\n') this.line++
      this.advance()
    }

    if (this.isAtEnd()) {
      console.error(this.line, 'Unterminated string.')
      return
    }

    // The closing ".
    this.advance()

    // Trim the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1)
    this.addTokenLiteral(TokenKind.String, value)
  }

  private number() {
    while (this.isDigit(this.peek())) this.advance()

    let fractional = false
    // Look for a fractional part.
    if (this.peek() == '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance()
      fractional = true

      while (this.isDigit(this.peek())) this.advance()
    }

    const text = this.source
      .substring(this.start, this.current)
      .replaceAll(/_/g, '')

    this.addTokenLiteral(TokenKind.Number, text)
  }

  private type(type: Type) {
    if (this.peek() == '[' && this.peekNext() == ']') {
      this.advance()
      this.advance()
      const text = this.source.substring(this.start, this.current)
      this.tokens.push(
        new Token(TokenKind.Type, text, null, this.line, Type.ArrayType, type),
      )
      return
    }
    const text = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(TokenKind.Type, text, null, this.line, type))
    return
  }

  private isDigit(c: string) {
    return (c >= '0' && c <= '9') || c == '_'
  }

  private isAlpha(c: string) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c)
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance()

    const text = this.source.substring(this.start, this.current)
    let type = Token.types.get(text)
    if (type != null) {
      return this.type(type)
    }

    let keyword = Token.keywords.get(text)
    if (keyword != null) {
      this.addToken(keyword)
      return
    }

    this.addToken(TokenKind.Identifier)
  }
}
