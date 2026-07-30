package main

import "fmt"

const (
	Monday = iota
	Tuesday
	Wednesday
	Thursday
	Friday
	Saturday
	Sunday
)

func main() {
	fmt.Println("Days of the week:")
	fmt.Println("Monday: ", Monday)
	
}