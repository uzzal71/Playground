package main

import "fmt"

type Payment interface {
	Pay(amount float64) error
	Refund(amount float64) error
}

// Stripe
type Stripe struct{}

func (s Stripe) Pay(amount float64) error {
	fmt.Printf("Stripe: Payment of $%.2f processed.\n", amount)
	return nil
}

func Checkout(p Payment, amount float64) error {
	return p.Pay(amount)
}

func CancelOrder(p Payment, amount float64) error {
	return p.Refund(amount)
}

func main() {

}