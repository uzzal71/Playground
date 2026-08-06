package main

import "fmt"

func main() {
	// Declare an array of integers with a length of 5
	var numbers [5]int

	// Assign values to the array elements
	numbers[0] = 10
	numbers[1] = 20
	numbers[2] = 30
	numbers[3] = 40
	numbers[4] = 50

	// Print the entire array
	fmt.Println("Array:", numbers)

	// Print individual elements of the array
	fmt.Println("First element:", numbers[0])
	fmt.Println("Second element:", numbers[1])
	fmt.Println("Third element:", numbers[2])
	fmt.Println("Fourth element:", numbers[3])
	fmt.Println("Fifth element:", numbers[4])

	// Get the length of the array
	length := len(numbers)
	fmt.Println("Length of the array:", length)
}