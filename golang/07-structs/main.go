package main

import "fmt"

type Person struct {
	Name string
	Age  int
}

func main() {
	p := Person{Name: "Alice", Age: 30}
	fmt.Println("Name:", p.Name)
	fmt.Println("Age:", p.Age)
}