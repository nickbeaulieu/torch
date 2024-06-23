import { Token, TokenType } from './token'

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
    this.tokens.push(new Token(TokenType.EOF, '', null, this.line))
  }

  private scanToken() {
    const c = this.advance()
    // prettier-ignore
    switch(c) {
      case '(': this.addToken(TokenType.LeftParen); break;
      case ')': this.addToken(TokenType.RightParen); break;
      case '{': this.addToken(TokenType.LeftBrace); break;
      case '}': this.addToken(TokenType.RightBrace); break;
      case ',': this.addToken(TokenType.Comma); break;
      case '.': this.addToken(TokenType.Dot); break;
      case '+': this.addToken(TokenType.Plus); break;
      case ';': this.addToken(TokenType.Semicolon); break;
      case '*': this.addToken(TokenType.Star); break; 
      case '%': this.addToken(TokenType.Percent); break; 
      
      case '-': this.addToken(this.match('>') ? TokenType.Arrow : TokenType.Minus); break;
      // prettier-ignore
      case '!': this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang); break;
      case '=': this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal);break;
      case '<': this.addToken(this.match('=') ? TokenType.LessOrEqual : TokenType.LessThan);break;
      case '>': this.addToken(this.match('=') ? TokenType.GreaterOrEqual : TokenType.GreaterThan);break;

      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line.
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.Slash);
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

  private addToken(type: TokenType) {
    this.addTokenLiteral(type, null)
  }

  private addTokenLiteral(type: TokenType, literal: string | number | null) {
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
    this.addTokenLiteral(TokenType.String, value)
  }

  private number() {
    while (this.isDigit(this.peek())) this.advance()

    // Look for a fractional part.
    if (this.peek() == '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance()

      while (this.isDigit(this.peek())) this.advance()
    }

    // FIXME: only parsing ints for now
    this.addTokenLiteral(
      TokenType.Number,
      Number.parseInt(this.source.substring(this.start, this.current)),
    )
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9'
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
    let type = Token.keywords.get(text)
    if (type == null) type = TokenType.Identifier
    this.addToken(type)
  }
}
