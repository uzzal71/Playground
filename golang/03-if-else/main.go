package main

// implement if-else statement in golang
import "fmt"

func main() {
	var num int = 10

	if num > 0 {
		fmt.Println("The number is positive.")
	} else if num < 0 {
		fmt.Println("The number is negative.")
	} else {
		fmt.Println("The number is zero.")
	}
}	