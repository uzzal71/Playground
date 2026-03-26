// A go program to demonstrate the use of keywords and data types in Go.
package main

/*
Author: Uzzal Kumar Roy
Date: 2024-06-01
Description: This program demonstrates the use of keywords and data types in Go.
*/

func main() {
	// string data type
	var name string = "Uzzal Kumar Roy"
	println("Name:", name)

	// int data type
	var age int = 30
	println("Age:", age)

	// float64 data type
	var height float64 = 5.9
	println("Height:", height)

	// bool data type
	var isStudent bool = false
	println("Is Student:", isStudent)

	// using short variable declaration
	country := "Bangladesh"
	println("Country:", country)

	// init8 data type
	var score int
	println("Score:", score) // default value of int is 0

	// using var with multiple variables
	var city, state string = "Dhaka", "Dhaka"
	println("City:", city, "State:", state)

	// uint8 data type
	var grade uint8 = 85
	println("Grade:", grade)
}
