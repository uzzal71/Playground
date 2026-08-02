package main

import "fmt"

func main() {
	var a int = 10
	var b int = 3

	// Arithmetic Operators
	fmt.Println("Addition:", a+b)
	fmt.Println("Subtraction:", a-b)
	fmt.Println("Multiplication:", a*b)
	fmt.Println("Division:", a/b)
	fmt.Println("Modulus:", a%b)

	// Relational Operators
	fmt.Println("Equal to:", a == b)
	fmt.Println("Not equal to:", a != b)
	fmt.Println("Greater than:", a > b)
	fmt.Println("Less than:", a < b)
	fmt.Println("Greater than or equal to:", a >= b)
	fmt.Println("Less than or equal to:", a <= b)

	// Logical Operators
	var x bool = true
	var y bool = false
	fmt.Println("Logical AND:", x && y)
	fmt.Println("Logical OR:", x || y)
	fmt.Println("Logical NOT:", !x)

	// Assignment Operators
	a += 5 // equivalent to a = a + 5
	fmt.Println("After a += 5:", a)
	a -= 2 // equivalent to a = a - 2
	fmt.Println("After a -= 2:", a)
	a *= 3 // equivalent to a = a * 3
	fmt.Println("After a *= 3:", a)
	a /= 4 // equivalent to a = a / 4
	fmt.Println("After a /= 4:", a)
	a %= 2 // equivalent to a = a % 2
	fmt.Println("After a %= 2:", a)

	// Bitwise Operators
	var c int = 5 // binary: 0101
	var d int = 3 // binary: 0011
	fmt.Println("Bitwise AND:", c&d)   // binary: 0001
	fmt.Println("Bitwise OR:", c|d)    // binary: 0111
	fmt.Println("Bitwise XOR:", c^d)   // binary: 0110
	fmt.Println("Bitwise AND NOT:", c&^d) // binary: 0100
	fmt.Println("Left Shift:", c<<1)     // binary: 1010
	fmt.Println("Right Shift:", c>>1)    // binary: 0010
}	