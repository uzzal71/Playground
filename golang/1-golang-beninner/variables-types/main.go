package main

import "fmt"

func main() {
	// var - explicity declaration
	var name string = "Uzzal"
	var age int = 29
	var retired bool = false
	
	fmt.Println(name, age, retired)

	// var with type inference
	var city = "Dhaka" // inferred as string
	var score = 95.6 // inferred as float64

	fmt.Println(city, score)

	// Short declaration (:=) - only inside functions
	count := 10 // inferred as int
	greeting := "Hello" // inferred as string
	active := true // inferred as bool

	fmt.Println(count, greeting, active)

	// const - immutable, must be assigned at declaration
	const pi = 3.14156
	const maxRetries int = 3
}