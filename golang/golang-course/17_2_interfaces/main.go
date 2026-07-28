package main

type Payment interface {
	Pay(amount float64) error
	refund(amount float64) error
}

func main() {

}