package main

import "fmt"
import "strconv"

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

	// Type Conversion
	// int <-> float64
	var i int = 42
	var f float64 = float64(i)
	var j int = int(f)
	fmt.Println("Integer:", i, "Float:", f, "Integer from float:", j)
	
	// string <-> []byte
	var str string = "Hello"
	var bytes []byte = []byte(str)
	fmt.Println("String:", str, "Bytes:", bytes)

	s := strconv.Itoa(42) // int to string
	n, _ := strconv.Atoi("123") // string to int
	fmt.Println("String from int:", s, "Int from string:", n)

	// float → string
	fs := fmt.Sprintf("%.2f", 3.14)  // "3.14"
	fmt.Println("Float to string:", fs)

	s1 := "256"
	n1, _ := strconv.Atoi(s1)
	result := strconv.Itoa(n1 * 2)
	fmt.Println(result) // "512"

	// zero values
	var zeroInt int
	var zeroFloat float64
	var zeroString string
	var zeroBool bool

	fmt.Println("Zero values:", zeroInt, zeroFloat, zeroString, zeroBool)
}