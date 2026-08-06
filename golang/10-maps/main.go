package main

import "fmt"

// implement golang map
func main() {
	m := make(map[string]int)
	m["apple"] = 5
	m["banana"] = 10
	fmt.Println(m)
}