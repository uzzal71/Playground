package main

type Payment interface {
	Pay(amount float64) error
	Refund(amount float64) error
}

func main() {
	
}