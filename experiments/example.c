#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <unistd.h>

#define SIZE 1024

int top = -1;
uint64_t inp_array[SIZE];
void push(uint64_t n);
uint64_t pop();

void dump(uint64_t n) {
    printf("%lu\n", n);
}

int main() {
    uint64_t a;
    uint64_t b;

    push(30);
    push(38);
    a = pop();
    b = pop();
    push(a + b);
    a = pop();
    dump(a);

    return 0;
}

void push(uint64_t n)
{
    int x;

    if (top == SIZE - 1)
    {
        printf("\nOverflow!!");
    }
    else
    {
        x = n;
        top = top + 1;
        inp_array[top] = x;
    }
}


uint64_t pop()
{
    if (top == -1)
    {
        printf("\nUnderflow!!");
        return 0;
    }
    else
    {
        return inp_array[top--];
    }
}
