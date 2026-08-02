package main

// implement loops in golang
import "fmt"

func main() {
	// for loop
	for i := 0; i < 5; i++ {
		fmt.Println("For Loop:", i)
	}

	// while loop (using for loop)
	j := 0
	for j < 5 {
		fmt.Println("While Loop:", j)
		j++
	}

	// infinite loop (commented out to prevent infinite execution)
	/*
	for {
		fmt.Println("Infinite Loop")
	}
	*/

	// break statement
	for k := 0; k < 10; k++ {
		if k == 5 {
			break
		}
		fmt.Println("Break Statement:", k)
	}

	// continue statement
	for l := 0; l < 10; l++ {
		if l%2 == 0 {
			continue
		}
		fmt.Println("Continue Statement:", l)
	}
}