package main

func main() {
	type person struct {
		name string
		age  int
	}

	p1 := person{name: "Alice", age: 30}
	println("Name:", p1.name)
	println("Age:", p1.age)
}