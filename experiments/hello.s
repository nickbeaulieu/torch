//
// Assembler program to print "Hello World!"
// to stdout.
//
// X0-X2 - parameters to Unix system calls
// X16 - Mach System Call function number
//

.global _start			// Provide program starting address to linker
.align 4			// Make sure everything is aligned properly

_start: 
	sub sp, sp, #8
	movz x9, #30, lsl #0
	str x9, [sp]

// Setup the parameters to exit the program
// and then call the kernel to do it.
	mov     X0, #0		// Use 0 return code
	mov     X16, #1		// System call number 1 terminates this program
	svc     #0x80		// Call kernel to terminate the program
