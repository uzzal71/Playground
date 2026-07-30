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

const (
	Readable	= 1 << iota // i << 0 = 001
	Writable				// 1 << 1 = 010
	Executable				// 1 << 2 = 100
)

func main() {
	fmt.Println("Days of the week:")
	fmt.Println("Monday:", Monday)
	fmt.Print("Tuesday:", Thursday)
	fmt.Println("")
	fmt.Print("Wednesday:", Wednesday)
	fmt.Println("")
	fmt.Print("Thursday:", Thursday)
	fmt.Println("")
	fmt.Print("Friday:", Friday)
	fmt.Println("")
	fmt.Print("Saturday:", Saturday)
	fmt.Println("")
	fmt.Print("Sunday:", Sunday)


	fmt.Println("\nFile permissions:")
	fmt.Printf("Readable: %03b\n", Readable)
	fmt.Printf("Writable: %03b\n", Writable)
	fmt.Printf("Executable: %03b\n", Executable)
}