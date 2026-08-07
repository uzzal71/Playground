package main

// implementation golang pointers
import "fmt"

func main() {
	var a int = 10
	var b *int = &a // b is a pointer to a

	fmt.Println("Value of a:", a)	   // Output: Value of a: 10
	fmt.Println("Address of a:", &a)    // Output: Address of a: <memory_address>
	fmt.Println("Value of b:", *b)      // Output: Value of b: 10
	fmt.Println("Address stored in b:", b) // Output: Address stored in b: <memory_address>		
}