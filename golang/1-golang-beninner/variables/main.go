// A go program to demonstrate the use of variable in golang.
package main

/*
Author: Uzzal Kumar Roy
Date: 2024-06-01
Description: This program demonstrates the use of variables in Golang.
*/

func main() {
	// variable naming convention: variable names should be descriptive and start with a letter. 
	// They can contain letters, digits, and underscores, but cannot start with a digit.
	// declaring a variable using var keyword
	var age int = 30
	println("Age:", age)

	name := "Uzzal Kumar Roy"
	println("Name:", name)

	firstName, lastName := "Uzzal", "Roy"
	println("First Name:", firstName)
	println("Last Name:", lastName)

	// declaring multiple variables in a single line
	var (
		city    string = "Dhaka"
		country string = "Bangladesh"
	)
	println("City:", city)
	println("Country:", country)

	// declaring a variable without initializing it, it will have the zero value of its type
	var isStudent bool
	println("Is Student:", isStudent) // false
}
