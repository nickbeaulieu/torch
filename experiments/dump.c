#include <stdio.h>
#include <stdint.h>
#include <unistd.h>

void dump(uint64_t n) {
  char buf[32];
  size_t buf_sz = 1;
  buf[sizeof(buf) - buf_sz] = '\n';
  do {
    buf[sizeof(buf) - buf_sz - 1] = n % 10 + '0';
    buf_sz++;
    n /= 10;
  } while (n);

  write(1, &buf[sizeof(buf) - buf_sz], buf_sz);
}

int main() {
  dump(69);
  dump(420);
  return 0;
}