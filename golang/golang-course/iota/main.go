package main

import "fmt"

const (
	_ = iota
	Monday
	Tuesday
	Wednesday
	Thursday
	Friday
	Saturday
	Sunday
)

func main() {
	fmt.Println("Days of the week:")
	fmt.Println("Monday:", Monday)
	fmt.Print("Tuesday:", Thursday)
	fmt.Print("Wednesday:", Wednesday)
	fmt.Print("Thursday:", Thursday)
	fmt.Print("Friday:", Friday)
	fmt.Print("Saturday:", Saturday)
	fmt.Print("Sunday:", Sunday)

}