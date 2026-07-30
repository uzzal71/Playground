package main

import "fmt"

type Counter struct {
	count int
}

func (c *Counter) Increment() {
	c.count += 1
}

func NewCounter() *Counter {
	return new(Counter) // Counter {count : 0} new keywork initialize count 0
}

func main() {
	// new keyword
	counter := NewCounter()
	counter.Increment()
	fmt.Println("count:", counter.count)
}